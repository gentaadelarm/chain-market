type FallbackNetwork =
  | "bnb-mainnet"
  | "base-mainnet"
  | "sol-mainnet";

export type RpcFallbackToken = {
  address: string;
  network: FallbackNetwork;
  tokenAddress?: string | null;
  tokenBalance?: string | null;
  tokenMetadata?: {
    decimals?: number;
    logo?: string;
    name?: string;
    symbol?: string;
  } | null;
  tokenPrices?: Array<{
    currency?: string;
    value?: string;
    lastUpdatedAt?: string;
  }> | null;
};

type RpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
  };
};

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const BALANCE_OF = "70a08231";
const DECIMALS = "313ce567";
const SYMBOL = "95d89b41";
const NAME = "06fdde03";

const LOOKBACK_BLOCKS = 1_000_000;
const START_CHUNK = 10_000;
const MIN_CHUNK = 500;
const RPC_TIMEOUT = 12_000;

async function rpc<T>(
  rpcUrl: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    RPC_TIMEOUT
  );

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    const data = (await response.json()) as RpcResponse<T>;

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message ??
          `RPC HTTP ${response.status}`
      );
    }

    if (data.result === undefined) {
      throw new Error(
        `RPC ${method} tidak mengembalikan result.`
      );
    }

    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

function topicAddress(address: string) {
  return `0x${address
    .replace(/^0x/, "")
    .toLowerCase()
    .padStart(64, "0")}`;
}

function decodeString(hex?: string): string | null {
  if (!hex || hex === "0x") return null;

  try {
    const clean = hex.replace(/^0x/, "");

    // ABI dynamic string.
    if (clean.length >= 128) {
      const offset = Number(
        BigInt(`0x${clean.slice(0, 64)}`)
      );

      const lengthPos = offset * 2;

      if (
        Number.isFinite(offset) &&
        clean.length >= lengthPos + 64
      ) {
        const length = Number(
          BigInt(
            `0x${clean.slice(
              lengthPos,
              lengthPos + 64
            )}`
          )
        );

        const start = lengthPos + 64;
        const end = start + length * 2;

        if (
          length >= 0 &&
          end <= clean.length
        ) {
          return (
            Buffer.from(
              clean.slice(start, end),
              "hex"
            )
              .toString("utf8")
              .replace(/\0/g, "")
              .trim() || null
          );
        }
      }
    }

    // bytes32 / short string.
    return (
      Buffer.from(
        clean.slice(0, 64),
        "hex"
      )
        .toString("utf8")
        .replace(/\0/g, "")
        .trim() || null
    );
  } catch {
    return null;
  }
}

async function nativeToken(
  address: string,
  network: "bnb-mainnet" | "base-mainnet",
  rpcUrl: string
): Promise<RpcFallbackToken | null> {
  try {
    const raw = await rpc<string>(
      rpcUrl,
      "eth_getBalance",
      [address, "latest"]
    );

    if (
      !raw ||
      BigInt(raw) <= BigInt("0")
    ) {
      return null;
    }

    const isBnb =
      network === "bnb-mainnet";

    return {
      address,
      network,
      tokenAddress: null,
      tokenBalance: raw,
      tokenMetadata: {
        decimals: 18,
        symbol: isBnb ? "BNB" : "ETH",
        name: isBnb
          ? "BNB Smart Chain"
          : "Ethereum",
      },
      tokenPrices: null,
    };
  } catch (error) {
    console.warn(
      `[RPC FALLBACK] native ${network} gagal:`,
      error
    );

    return null;
  }
}

async function discoverErc20(
  address: string,
  network: "bnb-mainnet" | "base-mainnet",
  rpcUrl: string
): Promise<RpcFallbackToken[]> {
  const blockHex = await rpc<string>(
    rpcUrl,
    "eth_blockNumber",
    []
  );

  const latestBlock = Number(
    BigInt(blockHex)
  );

  const fromBlock = Math.max(
    0,
    latestBlock - LOOKBACK_BLOCKS
  );

  const contracts = new Set<string>();
  const wallet = topicAddress(address);

  async function scanDirection(
    topicIndex: 1 | 2
  ) {
    let cursor = fromBlock;
    let chunk = START_CHUNK;

    while (
      cursor <= latestBlock &&
      contracts.size < 500
    ) {
      const toBlock = Math.min(
        latestBlock,
        cursor + chunk - 1
      );

      const topics =
        topicIndex === 1
          ? [TRANSFER_TOPIC, wallet]
          : [
              TRANSFER_TOPIC,
              null,
              wallet,
            ];

      try {
        const logs = await rpc<
          Array<{
            address?: string;
          }>
        >(
          rpcUrl,
          "eth_getLogs",
          [
            {
              fromBlock: `0x${cursor.toString(16)}`,
              toBlock: `0x${toBlock.toString(16)}`,
              topics,
            },
          ]
        );

        for (const log of logs) {
          if (log.address) {
            contracts.add(
              log.address.toLowerCase()
            );
          }
        }

        cursor = toBlock + 1;

        if (chunk < START_CHUNK) {
          chunk = Math.min(
            START_CHUNK,
            chunk * 2
          );
        }
      } catch (error) {
        if (chunk > MIN_CHUNK) {
          chunk = Math.max(
            MIN_CHUNK,
            Math.floor(chunk / 2)
          );

          console.warn(
            `[RPC FALLBACK] ${network} eth_getLogs retry chunk=${chunk}`
          );

          continue;
        }

        console.warn(
          `[RPC FALLBACK] ${network} eth_getLogs gagal ${cursor}-${toBlock}:`,
          error
        );

        cursor = toBlock + 1;
      }
    }
  }

  await scanDirection(1);
  await scanDirection(2);

  console.log(
    `[RPC FALLBACK] ${network} discovered contracts=${contracts.size}`
  );

  const result: RpcFallbackToken[] = [];

  for (const tokenAddress of contracts) {
    try {
      const balanceData = await rpc<string>(
        rpcUrl,
        "eth_call",
        [
          {
            to: tokenAddress,
            data:
              `0x${BALANCE_OF}` +
              address
                .replace(/^0x/, "")
                .toLowerCase()
                .padStart(64, "0"),
          },
          "latest",
        ]
      );

      if (
        !balanceData ||
        BigInt(balanceData) <= BigInt("0")
      ) {
        continue;
      }

      const decimalsData =
        await rpc<string>(
          rpcUrl,
          "eth_call",
          [
            {
              to: tokenAddress,
              data: `0x${DECIMALS}`,
            },
            "latest",
          ]
        );

      const decimals = Number(
        BigInt(decimalsData)
      );

      if (
        !Number.isInteger(decimals) ||
        decimals < 0 ||
        decimals > 36
      ) {
        continue;
      }

      const [symbolData, nameData] =
        await Promise.all([
          rpc<string>(
            rpcUrl,
            "eth_call",
            [
              {
                to: tokenAddress,
                data: `0x${SYMBOL}`,
              },
              "latest",
            ]
          ),
          rpc<string>(
            rpcUrl,
            "eth_call",
            [
              {
                to: tokenAddress,
                data: `0x${NAME}`,
              },
              "latest",
            ]
          ),
        ]);

      result.push({
        address,
        network,
        tokenAddress,
        tokenBalance: balanceData,
        tokenMetadata: {
          decimals,
          symbol:
            decodeString(symbolData) ??
            "ERC20",
          name:
            decodeString(nameData) ??
            tokenAddress,
        },
        tokenPrices: null,
      });
    } catch (error) {
      console.warn(
        `[RPC FALLBACK] ${network} token ${tokenAddress} gagal:`,
        error
      );
    }
  }

  return result;
}

async function scanSolana(
  address: string,
  rpcUrl: string
): Promise<RpcFallbackToken[]> {
  const result: RpcFallbackToken[] = [];

  try {
    const native = await rpc<{
      value?: number;
    }>(
      rpcUrl,
      "getBalance",
      [address]
    );

    if (
      Number(native.value ?? 0) > 0
    ) {
      result.push({
        address,
        network: "sol-mainnet",
        tokenAddress: null,
        tokenBalance: String(
          native.value
        ),
        tokenMetadata: {
          decimals: 9,
          symbol: "SOL",
          name: "Solana",
        },
        tokenPrices: null,
      });
    }

    const accounts = await rpc<{
      value?: Array<{
        account?: {
          data?: {
            parsed?: {
              info?: {
                mint?: string;
                tokenAmount?: {
                  amount?: string;
                  decimals?: number;
                };
              };
            };
          };
        };
      }>;
    }>(
      rpcUrl,
      "getTokenAccountsByOwner",
      [
        address,
        {
          programId:
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          encoding: "jsonParsed",
        },
      ]
    );

    for (
      const item of accounts.value ?? []
    ) {
      const info =
        item.account?.data?.parsed?.info;

      const mint = info?.mint;
      const amount =
        info?.tokenAmount?.amount;
      const decimals =
        info?.tokenAmount?.decimals;

      if (
        !mint ||
        !amount ||
        decimals == null
      ) {
        continue;
      }

      if (
        BigInt(amount) <= BigInt("0")
      ) {
        continue;
      }

      result.push({
        address,
        network: "sol-mainnet",
        tokenAddress: mint,
        tokenBalance: amount,
        tokenMetadata: {
          decimals,
          symbol: "SPL",
          name: mint,
        },
        tokenPrices: null,
      });
    }
  } catch (error) {
    console.warn(
      "[RPC FALLBACK] Solana gagal:",
      error
    );
  }

  return result;
}

export async function scanRpcFallback({
  evmAddress,
  solanaAddress,
}: {
  evmAddress?: string;
  solanaAddress?: string;
}): Promise<RpcFallbackToken[]> {
  const result: RpcFallbackToken[] = [];

  if (evmAddress) {
    const targets = [
      {
        network: "bnb-mainnet" as const,
        rpcUrl:
          process.env.BSC_RPC_URL?.trim(),
      },
      {
        network: "base-mainnet" as const,
        rpcUrl:
          process.env.BASE_RPC_URL?.trim(),
      },
    ];

    for (const target of targets) {
      if (!target.rpcUrl) {
        console.warn(
          `[RPC FALLBACK] ${target.network} RPC belum diset.`
        );
        continue;
      }

      const native =
        await nativeToken(
          evmAddress,
          target.network,
          target.rpcUrl
        );

      if (native) {
        result.push(native);
      }

      try {
        const erc20 =
          await discoverErc20(
            evmAddress,
            target.network,
            target.rpcUrl
          );

        result.push(...erc20);
      } catch (error) {
        console.warn(
          `[RPC FALLBACK] ${target.network} discovery gagal:`,
          error
        );
      }
    }
  }

  if (solanaAddress) {
    const rpcUrl =
      process.env.SOLANA_RPC_URL?.trim();

    if (rpcUrl) {
      result.push(
        ...(await scanSolana(
          solanaAddress,
          rpcUrl
        ))
      );
    }
  }

  return result;
}

export async function getRpcFallbackPrice(
  network: FallbackNetwork,
  tokenAddress: string | null
): Promise<number | null> {
  try {
    if (tokenAddress) {
      const chain =
        network === "bnb-mainnet"
          ? "bsc"
          : network === "base-mainnet"
            ? "base"
            : "solana";

      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
        {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        pairs?: Array<{
          chainId?: string;
          priceUsd?: string | null;
          liquidity?: {
            usd?: number | null;
          } | null;
        }>;
      };

      const pair = (data.pairs ?? [])
        .filter(
          (pair) =>
            pair.chainId === chain &&
            pair.priceUsd
        )
        .sort(
          (a, b) =>
            Number(
              b.liquidity?.usd ?? 0
            ) -
            Number(
              a.liquidity?.usd ?? 0
            )
        )[0];

      const price = Number(
        pair?.priceUsd
      );

      return Number.isFinite(price) &&
        price > 0
        ? price
        : null;
    }

    if (network === "bnb-mainnet") {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
        {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) return null;

      const data = (await response.json()) as {
        price?: string;
      };

      const price = Number(data.price);

      return Number.isFinite(price) &&
        price > 0
        ? price
        : null;
    }

    const id =
      network === "sol-mainnet"
        ? "solana"
        : "ethereum";

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as Record<
      string,
      { usd?: number }
    >;

    const price = Number(
      data[id]?.usd
    );

    return Number.isFinite(price) &&
      price > 0
      ? price
      : null;
  } catch {
    return null;
  }
}

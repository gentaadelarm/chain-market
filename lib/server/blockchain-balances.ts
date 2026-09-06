import { formatUnits } from "ethers";
import {
  getRpcFallbackPrice,
  scanRpcFallback,
} from "./rpc-portfolio-fallback";

type WalletChain = "bsc" | "base" | "solana";

type WalletRecord = {
  id: string;
  user_id: string;
  chain: WalletChain;
  address: string;
};

export type AlchemyNetwork =
  | "eth-mainnet"
  | "base-mainnet"
  | "arb-mainnet"
  | "opt-mainnet"
  | "matic-mainnet"
  | "polygonzkevm-mainnet"
  | "bnb-mainnet"
  | "avalanche-mainnet"
  | "zksync-mainnet"
  | "linea-mainnet"
  | "scroll-mainnet"
  | "blast-mainnet"
  | "zora-mainnet"
  | "gnosis-mainnet"
  | "celo-mainnet"
  | "fantom-mainnet"
  | "metis-mainnet"
  | "moonbeam-mainnet"
  | "mantle-mainnet"
  | "fraxtal-mainnet"
  | "worldchain-mainnet"
  | "unichain-mainnet"
  | "soneium-mainnet"
  | "ink-mainnet"
  | "berachain-mainnet"
  | "apechain-mainnet"
  | "cronos-mainnet"
  | "shape-mainnet"
  | "sei-mainnet"
  | "sonic-mainnet"
  | "opbnb-mainnet"
  | "rootstock-mainnet"
  | "zetachain-mainnet"
  | "arbitrum-nova-mainnet"
  | "mode-mainnet"
  | "bob-mainnet"
  | "monad-mainnet"
  | "sol-mainnet";

type AssetChain =
  | "ethereum"
  | "base"
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "polygon-zkevm"
  | "bsc"
  | "avalanche"
  | "zksync"
  | "linea"
  | "scroll"
  | "blast"
  | "zora"
  | "gnosis"
  | "celo"
  | "fantom"
  | "metis"
  | "moonbeam"
  | "mantle"
  | "fraxtal"
  | "worldchain"
  | "unichain"
  | "soneium"
  | "ink"
  | "berachain"
  | "apechain"
  | "cronos"
  | "shape"
  | "sei"
  | "sonic"
  | "opbnb"
  | "rootstock"
  | "zetachain"
  | "arbitrum-nova"
  | "mode"
  | "bob"
  | "monad"
  | "solana";

type NetworkMeta = {
  chain: AssetChain;
  nativeSymbol: string;
  nativeName: string;
};

const NETWORK_META: Record<AlchemyNetwork, NetworkMeta> = {
  "eth-mainnet": {
    chain: "ethereum",
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
  },
  "base-mainnet": {
    chain: "base",
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
  },
  "arb-mainnet": {
    chain: "arbitrum",
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
  },
  "opt-mainnet": {
    chain: "optimism",
    nativeSymbol: "ETH",
    nativeName: "Ethereum",
  },
  "matic-mainnet": {
    chain: "polygon",
    nativeSymbol: "POL",
    nativeName: "Polygon",
  },
  "polygonzkevm-mainnet": {
    chain: "polygon-zkevm",
    nativeSymbol: "ETH",
    nativeName: "Polygon zkEVM",
  },
  "bnb-mainnet": {
    chain: "bsc",
    nativeSymbol: "BNB",
    nativeName: "BNB Smart Chain",
  },
  "avalanche-mainnet": {
    chain: "avalanche",
    nativeSymbol: "AVAX",
    nativeName: "Avalanche",
  },
  "zksync-mainnet": {
    chain: "zksync",
    nativeSymbol: "ETH",
    nativeName: "zkSync",
  },
  "linea-mainnet": {
    chain: "linea",
    nativeSymbol: "ETH",
    nativeName: "Linea",
  },
  "scroll-mainnet": {
    chain: "scroll",
    nativeSymbol: "ETH",
    nativeName: "Scroll",
  },
  "blast-mainnet": {
    chain: "blast",
    nativeSymbol: "ETH",
    nativeName: "Blast",
  },
  "zora-mainnet": {
    chain: "zora",
    nativeSymbol: "ETH",
    nativeName: "Zora",
  },
  "gnosis-mainnet": {
    chain: "gnosis",
    nativeSymbol: "xDAI",
    nativeName: "Gnosis",
  },
  "celo-mainnet": {
    chain: "celo",
    nativeSymbol: "CELO",
    nativeName: "Celo",
  },
  "fantom-mainnet": {
    chain: "fantom",
    nativeSymbol: "FTM",
    nativeName: "Fantom",
  },
  "metis-mainnet": {
    chain: "metis",
    nativeSymbol: "METIS",
    nativeName: "Metis",
  },
  "moonbeam-mainnet": {
    chain: "moonbeam",
    nativeSymbol: "GLMR",
    nativeName: "Moonbeam",
  },
  "mantle-mainnet": {
    chain: "mantle",
    nativeSymbol: "MNT",
    nativeName: "Mantle",
  },
  "fraxtal-mainnet": {
    chain: "fraxtal",
    nativeSymbol: "frxETH",
    nativeName: "Fraxtal",
  },
  "worldchain-mainnet": {
    chain: "worldchain",
    nativeSymbol: "ETH",
    nativeName: "World Chain",
  },
  "unichain-mainnet": {
    chain: "unichain",
    nativeSymbol: "ETH",
    nativeName: "Unichain",
  },
  "soneium-mainnet": {
    chain: "soneium",
    nativeSymbol: "ETH",
    nativeName: "Soneium",
  },
  "ink-mainnet": {
    chain: "ink",
    nativeSymbol: "ETH",
    nativeName: "Ink",
  },
  "berachain-mainnet": {
    chain: "berachain",
    nativeSymbol: "BERA",
    nativeName: "Berachain",
  },
  "apechain-mainnet": {
    chain: "apechain",
    nativeSymbol: "APE",
    nativeName: "ApeChain",
  },
  "cronos-mainnet": {
    chain: "cronos",
    nativeSymbol: "CRO",
    nativeName: "Cronos",
  },
  "shape-mainnet": {
    chain: "shape",
    nativeSymbol: "ETH",
    nativeName: "Shape",
  },
  "sei-mainnet": {
    chain: "sei",
    nativeSymbol: "SEI",
    nativeName: "Sei",
  },
  "sonic-mainnet": {
    chain: "sonic",
    nativeSymbol: "S",
    nativeName: "Sonic",
  },
  "opbnb-mainnet": {
    chain: "opbnb",
    nativeSymbol: "BNB",
    nativeName: "opBNB",
  },
  "rootstock-mainnet": {
    chain: "rootstock",
    nativeSymbol: "RBTC",
    nativeName: "Rootstock",
  },
  "zetachain-mainnet": {
    chain: "zetachain",
    nativeSymbol: "ZETA",
    nativeName: "ZetaChain",
  },
  "arbitrum-nova-mainnet": {
    chain: "arbitrum-nova",
    nativeSymbol: "ETH",
    nativeName: "Arbitrum Nova",
  },
  "mode-mainnet": {
    chain: "mode",
    nativeSymbol: "ETH",
    nativeName: "Mode",
  },
  "bob-mainnet": {
    chain: "bob",
    nativeSymbol: "ETH",
    nativeName: "BOB",
  },
  "monad-mainnet": {
    chain: "monad",
    nativeSymbol: "MON",
    nativeName: "Monad",
  },
  "sol-mainnet": {
    chain: "solana",
    nativeSymbol: "SOL",
    nativeName: "Solana",
  },
};

const EVM_NETWORKS: AlchemyNetwork[] = [
  "eth-mainnet",
  "base-mainnet",
  "arb-mainnet",
  "opt-mainnet",
  "matic-mainnet",
  "bnb-mainnet",
  "zksync-mainnet",
  "linea-mainnet",
  "scroll-mainnet",
  "blast-mainnet",
  "zora-mainnet",
  "gnosis-mainnet",
  "celo-mainnet",
  "worldchain-mainnet",
  "unichain-mainnet",
  "soneium-mainnet",
  "ink-mainnet",
  "berachain-mainnet",
  "apechain-mainnet",
  "shape-mainnet",
  "rootstock-mainnet",
  "zetachain-mainnet",
  "monad-mainnet",
];

const SOLANA_NETWORKS: AlchemyNetwork[] = ["sol-mainnet"];

type PortfolioToken = {
  address: string;
  network: AlchemyNetwork;
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
  error?: string | null;
};

type AlchemyResponse = {
  data?: {
    tokens?: PortfolioToken[];
    pageKey?: string;
  };
  error?: {
    message?: string;
    partialErrors?: Array<{
      network?: string;
      message?: string;
    }>;
  };
};

export type WalletPortfolioBalance = {
  wallet_id: string;
  user_id: string;
  asset_id: string;
  balance: string;
  price_usd: number;
  value_usd: number;
  asset: {
    id: string;
    symbol: string;
    name: string;
    chain: AssetChain;
    network: AlchemyNetwork;
    contract_address: string | null;
    decimals: number;
    is_native: boolean;
    logo_url: string | null;
  };
};

const ALCHEMY_API_URL = "https://api.g.alchemy.com/data/v1";

function getUsdPrice(token: PortfolioToken) {
  const price = token.tokenPrices?.find(
    (item) => item.currency?.toLowerCase() === "usd"
  );

  if (!price?.value) return null;

  const value = Number(price.value);

  return Number.isFinite(value) && value > 0 ? value : null;
}

function getBnbPriceFromTokens(tokens: PortfolioToken[]) {
  for (const token of tokens) {
    if (
      token.network !== "bnb-mainnet" ||
      token.tokenAddress !== null
    ) {
      continue;
    }

    const price = getUsdPrice(token);

    if (price != null) {
      return price;
    }
  }

  return null;
}

function getBalance(rawBalance: string, decimals: number) {
  try {
    return formatUnits(BigInt(rawBalance), decimals);
  } catch {
    return "0";
  }
}

function makeAssetId(
  network: AlchemyNetwork,
  tokenAddress: string | null
) {
  return [
    "alchemy",
    network,
    tokenAddress?.toLowerCase() ?? "native",
  ].join(":");
}

async function requestAlchemy(
  addresses: Array<{
    address: string;
    networks: AlchemyNetwork[];
  }>
) {
  const apiKey = process.env.ALCHEMY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY belum diset.");
  }

  const allTokens: PortfolioToken[] = [];
  const partialErrors: Array<{
    network?: string;
    message?: string;
  }> = [];

  const MAX_NETWORKS_PER_REQUEST = 20;

  const requestPage = async (
    batch: Array<{
      address: string;
      networks: AlchemyNetwork[];
    }>
  ) => {
    let pageKey: string | undefined;
    let page = 0;

    do {
      const response = await fetch(
        `${ALCHEMY_API_URL}/${apiKey}/assets/tokens/by-address`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            addresses: batch,
            withMetadata: true,
            withPrices: true,
            includeNativeTokens: true,
            includeErc20Tokens: true,
            includeBlockMetadata: false,
            ...(pageKey ? { pageKey } : {}),
          }),
        }
      );

      const raw = await response.text();

      let data: AlchemyResponse;

      try {
        data = JSON.parse(raw) as AlchemyResponse;
      } catch {
        throw new Error(
          `Alchemy response bukan JSON (${response.status}): ${raw.slice(
            0,
            300
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error?.message ??
            `Alchemy Portfolio API HTTP ${response.status}`
        );
      }

      if (data.data?.tokens) {
        allTokens.push(...data.data.tokens);

        for (const token of data.data.tokens) {
          if (
            token.network === "bnb-mainnet" ||
            token.tokenAddress === null
          ) {
            console.log(
              "[ALCHEMY TOKEN]",
              JSON.stringify({
                network: token.network,
                address: token.address,
                tokenAddress: token.tokenAddress,
                tokenBalance: token.tokenBalance,
                symbol: token.tokenMetadata?.symbol,
                name: token.tokenMetadata?.name,
                decimals: token.tokenMetadata?.decimals,
                prices: token.tokenPrices,
              })
            );
          }
        }
      }

      if (data.error?.partialErrors) {
        partialErrors.push(...data.error.partialErrors);
      }

      pageKey = data.data?.pageKey;
      page += 1;

      if (page >= 20) {
        console.warn(
          "Alchemy pagination stopped after 20 pages.",
          batch.map((item) => item.networks)
        );
        break;
      }
    } while (pageKey);
  };

  /*
   * Alchemy Portfolio API max 20 unique networks per request.
   * Kita split secara deterministic, bukan recursive probing.
   */
  const evmAddresses = addresses.filter((item) =>
    item.networks.some((network) => network !== "sol-mainnet")
  );

  const solanaAddresses = addresses.filter((item) =>
    item.networks.includes("sol-mainnet")
  );

  const evmNetworks = Array.from(
    new Set(
      evmAddresses.flatMap((item) =>
        item.networks.filter((network) => network !== "sol-mainnet")
      )
    )
  );

  for (
    let i = 0;
    i < evmNetworks.length;
    i += MAX_NETWORKS_PER_REQUEST
  ) {
    const networkBatch = evmNetworks.slice(
      i,
      i + MAX_NETWORKS_PER_REQUEST
    ) as Exclude<AlchemyNetwork, "sol-mainnet">[];

    if (networkBatch.length === 0 || evmAddresses.length === 0) {
      continue;
    }

    await requestPage(
      evmAddresses.map((item) => ({
        address: item.address,
        networks: item.networks.filter((network) =>
          networkBatch.includes(
            network as Exclude<AlchemyNetwork, "sol-mainnet">
          )
        ),
      }))
    );
  }

  /*
   * Solana request terpisah.
   */
  if (solanaAddresses.length > 0) {
    await requestPage(
      solanaAddresses.map((item) => ({
        address: item.address,
        networks: ["sol-mainnet"],
      }))
    );
  }

  return {
    tokens: allTokens,
    partialErrors,
  };
}


async function getBnbUsdPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
      {
        method: "GET",
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
      price?: string;
    };

    const price = Number(data.price);

    return Number.isFinite(price) && price > 0
      ? price
      : null;
  } catch {
    return null;
  }
}


async function getBnbNativeFallback(
  address: string
): Promise<PortfolioToken | null> {
  const apiKey = process.env.ALCHEMY_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://bnb-mainnet.g.alchemy.com/v2/${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [address, "latest"],
        }),
      }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      result?: string;
    };

    if (!data.result || BigInt(data.result) <= 0n) {
      return null;
    }

    return {
      address,
      network: "bnb-mainnet",
      tokenAddress: null,
      tokenBalance: data.result,
      tokenMetadata: {
        decimals: 18,
        symbol: "BNB",
        name: "BNB Smart Chain",
      },
      tokenPrices: null,
    };
  } catch {
    return null;
  }
}

export async function scanWalletPortfolio({
  wallets,
}: {
  wallets: WalletRecord[];
}) {
  const evmWallet = wallets.find(
    (wallet) =>
      wallet.chain === "bsc" ||
      wallet.chain === "base"
  );

  const solanaWallet = wallets.find(
    (wallet) => wallet.chain === "solana"
  );

  const addresses: Array<{
    address: string;
    networks: AlchemyNetwork[];
  }> = [];

  const walletByAddress = new Map<string, WalletRecord>();

  if (evmWallet?.address) {
    addresses.push({
      address: evmWallet.address,
      networks: EVM_NETWORKS,
    });

    walletByAddress.set(
      evmWallet.address.toLowerCase(),
      evmWallet
    );
  }

  if (solanaWallet?.address) {
    addresses.push({
      address: solanaWallet.address,
      networks: SOLANA_NETWORKS,
    });

    walletByAddress.set(
      solanaWallet.address,
      solanaWallet
    );
  }

  if (addresses.length === 0) {
    return [];
  }

  let tokens: PortfolioToken[] = [];
  let partialErrors: unknown[] = [];
  let alchemyFailed = false;

  try {
    const portfolio = await requestAlchemy(addresses);
    tokens = portfolio.tokens;
    partialErrors = portfolio.partialErrors;
  } catch (error) {
    alchemyFailed = true;

    console.warn(
      "Alchemy Portfolio API gagal, aktifkan RPC fallback:",
      error
    );
  }

  if (alchemyFailed) {
    const fallbackTokens = await scanRpcFallback({
      evmAddress: evmWallet?.address,
      solanaAddress: solanaWallet?.address,
    });

    if (fallbackTokens.length > 0) {
      tokens.push(...fallbackTokens);

      console.log(
        "[RPC FALLBACK] total token ditemukan:",
        fallbackTokens.length
      );
    } else {
      console.warn(
        "[RPC FALLBACK] tidak menemukan token."
      );
    }
  }

  const tokensWithFallback = [...tokens];

  let bnbPriceUsd = getBnbPriceFromTokens(tokens);

  // Portfolio API bisa habis quota. Harga native BNB tetap
  // harus tersedia agar hasil eth_getBalance bisa dihitung USD.
  if (bnbPriceUsd == null && evmWallet?.address) {
    bnbPriceUsd = await getBnbUsdPrice();
  }

  if (evmWallet?.address && !alchemyFailed) {
    const hasBnb = tokens.some((token) => {
      if (
        token.network !== "bnb-mainnet" ||
        token.tokenAddress != null ||
        !token.tokenBalance
      ) {
        return false;
      }

      try {
        return BigInt(token.tokenBalance) > 0n;
      } catch {
        return false;
      }
    });

    if (!hasBnb) {
      const bnb = await getBnbNativeFallback(
        evmWallet.address
      );

      if (bnb) {
        tokensWithFallback.push(bnb);
      }
    }
  }

  if (partialErrors.length > 0) {
    console.warn(
      "Alchemy Portfolio partial errors:",
      partialErrors
    );
  }

  const results: WalletPortfolioBalance[] = [];

  for (const token of tokensWithFallback) {
    const meta = NETWORK_META[token.network];

    if (!meta) continue;

    const wallet =
      walletByAddress.get(
        token.address.toLowerCase()
      ) ??
      (meta.chain === "solana"
        ? solanaWallet
        : evmWallet);

    if (!wallet) continue;

    const tokenAddress = token.tokenAddress ?? null;
    const decimals =
      token.tokenMetadata?.decimals ??
      (tokenAddress === null ? 18 : null);
    const rawBalance = token.tokenBalance;

    if (decimals == null || !rawBalance) {
      continue;
    }

    const balance = getBalance(
      rawBalance,
      decimals
    );

    const balanceNumber = Number(balance);

    if (
      !Number.isFinite(balanceNumber) ||
      balanceNumber <= 0
    ) {
      continue;
    }

    let priceUsd = getUsdPrice(token);

    if (priceUsd == null) {
      if (
        token.network === "eth-mainnet" ||
        token.network === "bnb-mainnet" ||
        token.network === "base-mainnet" ||
        token.network === "arb-mainnet" ||
        token.network === "opt-mainnet" ||
        token.network === "matic-mainnet" ||
        token.network === "sol-mainnet"
      ) {
        priceUsd = await getRpcFallbackPrice(
          token.network,
          token.tokenAddress ?? null
        );
      }
    }

    // Native BNB fallback dari eth_getBalance tidak membawa tokenPrices.
    // Ambil harga BNB dari Alchemy Portfolio bila tersedia pada token lain;
    // sementara gunakan harga dari env jika dikonfigurasi.
    if (
      priceUsd == null &&
      token.network === "bnb-mainnet" &&
      token.tokenAddress == null
    ) {
      if (bnbPriceUsd != null) {
        priceUsd = bnbPriceUsd;
      }
    }

    if (
      priceUsd == null ||
      !Number.isFinite(priceUsd) ||
      priceUsd <= 0
    ) {
      continue;
    }

    const valueUsd = balanceNumber * priceUsd;

    if (
      !Number.isFinite(valueUsd) ||
      valueUsd <= 0
    ) {
      continue;
    }

    const symbol =
      token.tokenMetadata?.symbol?.trim() ||
      meta.nativeSymbol;

    const name =
      token.tokenMetadata?.name?.trim() ||
      meta.nativeName;

    const assetId = makeAssetId(
      token.network,
      tokenAddress
    );

    results.push({
      wallet_id: wallet.id,
      user_id: wallet.user_id,
      asset_id: assetId,
      balance,
      price_usd: priceUsd,
      value_usd: valueUsd,
      asset: {
        id: assetId,
        symbol,
        name,
        chain: meta.chain,
        network: token.network,
        contract_address: tokenAddress,
        decimals,
        is_native: tokenAddress === null,
        logo_url:
          token.tokenMetadata?.logo ?? null,
      },
    });
  }

  return results.sort(
    (a, b) => b.value_usd - a.value_usd
  );
}

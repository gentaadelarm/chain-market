import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WalletRow = {
  chain: string;
  address: string;
};

const NETWORK_WS: Record<string, string> = {
  "eth-mainnet": "eth-mainnet",
  "base-mainnet": "base-mainnet",
  "arb-mainnet": "arb-mainnet",
  "opt-mainnet": "opt-mainnet",
  "matic-mainnet": "polygon-mainnet",
  "bnb-mainnet": "bnb-mainnet",
  "zksync-mainnet": "zksync-mainnet",
  "linea-mainnet": "linea-mainnet",
  "scroll-mainnet": "scroll-mainnet",
  "blast-mainnet": "blast-mainnet",
  "zora-mainnet": "zora-mainnet",
  "gnosis-mainnet": "gnosis-mainnet",
  "celo-mainnet": "celo-mainnet",
  "worldchain-mainnet": "worldchain-mainnet",
  "unichain-mainnet": "unichain-mainnet",
  "soneium-mainnet": "soneium-mainnet",
  "ink-mainnet": "ink-mainnet",
  "berachain-mainnet": "berachain-mainnet",
  "apechain-mainnet": "apechain-mainnet",
  "shape-mainnet": "shape-mainnet",
  "rootstock-mainnet": "rootstock-mainnet",
  "zetachain-mainnet": "zetachain-mainnet",
  "monad-mainnet": "monad-mainnet",
};

const encoder = new TextEncoder();

function padAddress(address: string) {
  return `0x${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
}

function sse(data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function wsUrl(network: string, apiKey: string) {
  return `wss://${NETWORK_WS[network]}.g.alchemy.com/v2/${apiKey}`;
}

async function getWallets() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("wallets")
    .select("chain,address")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WalletRow[];
}

export async function GET(request: Request) {
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!apiKey) {
    return new Response("ALCHEMY_API_KEY belum tersedia.", {
      status: 500,
    });
  }

  let wallets: WalletRow[];

  try {
    wallets = await getWallets();
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Unauthorized",
      {
        status: 401,
      }
    );
  }

  const evmAddress =
    wallets.find(
      (wallet) =>
        wallet.chain === "bsc" ||
        wallet.chain === "base"
    )?.address ?? null;

  const solanaAddress =
    wallets.find(
      (wallet) => wallet.chain === "solana"
    )?.address ?? null;

  const abortController = new AbortController();

  request.signal.addEventListener("abort", () => {
    abortController.abort();
  });

  const stream = new ReadableStream({
    start(controller) {
      const sockets: WebSocket[] = [];
      let closed = false;

      const cleanup = () => {
        if (closed) return;
        closed = true;

        for (const socket of sockets) {
          try {
            socket.close();
          } catch {}
        }

        sockets.length = 0;

        try {
          controller.close();
        } catch {}
      };

      const emit = (reason: string, network?: string) => {
        if (closed) return;

        try {
          controller.enqueue(
            sse({
              type: "wallet-change",
              reason,
              network: network ?? null,
              at: Date.now(),
            })
          );
        } catch {
          cleanup();
        }
      };

      controller.enqueue(
        sse({
          type: "connected",
          at: Date.now(),
        })
      );

      const subscribeEvm = (network: string) => {
        if (!evmAddress || !NETWORK_WS[network]) return;

        const socket = new WebSocket(
          wsUrl(network, apiKey)
        );

        sockets.push(socket);

        socket.onopen = () => {
          if (closed) return;

          // ERC-20 Transfer events involving this wallet.
          socket.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_subscribe",
              params: [
                "logs",
                {
                  topics: [
                    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55aeb0f7f4a1",
                    null,
                    padAddress(evmAddress),
                  ],
                },
              ],
            })
          );

          socket.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "eth_subscribe",
              params: [
                "logs",
                {
                  topics: [
                    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55aeb0f7f4a1",
                    padAddress(evmAddress),
                    null,
                  ],
                },
              ],
            })
          );

          // Native balance changes can happen without ERC-20 logs.
          socket.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 3,
              method: "eth_subscribe",
              params: ["newHeads"],
            })
          );
        };

        socket.onmessage = (event) => {
          if (closed) return;

          try {
            const message = JSON.parse(
              String(event.data)
            );

            if (message.method === "eth_subscription") {
              const result = message.params?.result;

              if (result?.topics?.[0]) {
                emit("erc20-transfer", network);
              } else {
                emit("new-block", network);
              }
            }
          } catch {
            // Ignore malformed websocket messages.
          }
        };

        socket.onerror = () => {
          emit("websocket-error", network);
        };

        socket.onclose = () => {
          if (!closed) {
            emit("websocket-closed", network);
          }
        };
      };

      if (evmAddress) {
        for (const network of Object.keys(NETWORK_WS)) {
          if (closed) break;
          subscribeEvm(network);
        }
      }

      // Solana uses Alchemy's Solana websocket endpoint.
      if (solanaAddress) {
        const socket = new WebSocket(
          `wss://solana-mainnet.g.alchemy.com/v2/${apiKey}`
        );

        sockets.push(socket);

        socket.onopen = () => {
          if (closed) return;

          // Native SOL balance.
          socket.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 100,
              method: "accountSubscribe",
              params: [
                solanaAddress,
                {
                  encoding: "base64",
                  commitment: "confirmed",
                },
              ],
            })
          );

          // SPL token activity involving this wallet.
          // This is used as a trigger; the actual balances still
          // come from the Alchemy Portfolio scanner.
          socket.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 101,
              method: "logsSubscribe",
              params: [
                {
                  mentions: [solanaAddress],
                },
                {
                  commitment: "confirmed",
                },
              ],
            })
          );

          emit("solana-connected", "sol-mainnet");
        };

        socket.onmessage = (event) => {
          if (closed) return;

          try {
            const message = JSON.parse(
              String(event.data)
            );

            if (
              message.method ===
              "accountNotification"
            ) {
              emit(
                "solana-account-change",
                "sol-mainnet"
              );
            }

            if (
              message.method ===
              "logsNotification"
            ) {
              emit(
                "solana-token-activity",
                "sol-mainnet"
              );
            }
          } catch {
            // Ignore malformed websocket messages.
          }
        };

        socket.onerror = () => {
          emit(
            "websocket-error",
            "sol-mainnet"
          );
        };
      }

      const heartbeat = setInterval(() => {
        if (closed) {
          clearInterval(heartbeat);
          return;
        }

        try {
          controller.enqueue(
            sse({
              type: "heartbeat",
              at: Date.now(),
            })
          );
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 25_000);

      request.signal.addEventListener(
        "abort",
        () => {
          clearInterval(heartbeat);
          cleanup();
        },
        { once: true }
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

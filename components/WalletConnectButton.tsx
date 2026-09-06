"use client";

import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type WalletType = "metamask" | "okx" | "phantom";

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<any>;
  providers?: Eip1193Provider[];
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isOKXWallet?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: any[]) => void
  ) => void;
};

type Eip6963ProviderDetail = {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: Eip1193Provider;
};

type SolanaProvider = {
  isPhantom?: boolean;
  publicKey?: {
    toString(): string;
  };
  connect: () => Promise<{
    publicKey: {
      toString(): string;
    };
  }>;
  disconnect?: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    encoding: string
  ) => Promise<{ signature: Uint8Array }>;
};

type WalletConnectButtonProps = {
  onConnected?: (connection: {
    wallet: WalletType;
    address: string;
  }) => void | Promise<void>;
  onDisconnected?: (wallet: WalletType) => void | Promise<void>;
  connected?: boolean;
};

function ethereumProvider(): Eip1193Provider | null {
  return (window as any).ethereum ?? null;
}

function phantomProvider(): SolanaProvider | null {
  return (window as any).phantom?.solana ?? null;
}

function solanaProvider(): SolanaProvider | null {
  return (window as any).solana ?? null;
}

function okxSolanaProvider(): SolanaProvider | null {
  return (window as any).okxwallet?.solana ?? null;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isMetaMaskProvider(detail: Eip6963ProviderDetail) {
  const name = normalizeName(detail.info.name);
  const rdns = detail.info.rdns.toLowerCase();

  return (
    name.includes("metamask") ||
    rdns.includes("metamask")
  );
}

function isOKXProvider(detail: Eip6963ProviderDetail) {
  const name = normalizeName(detail.info.name);
  const rdns = detail.info.rdns.toLowerCase();

  return (
    name.includes("okx") ||
    name.includes("okex") ||
    rdns.includes("okx") ||
    rdns.includes("okex")
  );
}

async function discoverProviders(): Promise<
  Eip6963ProviderDetail[]
> {
  const discovered = new Map<
    string,
    Eip6963ProviderDetail
  >();

  const handler = (event: Event) => {
    const detail =
      (event as CustomEvent<Eip6963ProviderDetail>)
        .detail;

    if (!detail?.info?.uuid || !detail?.provider) {
      return;
    }

    discovered.set(
      detail.info.uuid,
      detail
    );
  };

  window.addEventListener(
    "eip6963:announceProvider",
    handler
  );

  window.dispatchEvent(
    new Event("eip6963:requestProvider")
  );

  await new Promise((resolve) =>
    setTimeout(resolve, 300)
  );

  window.removeEventListener(
    "eip6963:announceProvider",
    handler
  );

  return Array.from(
    discovered.values()
  );
}

async function getEvmProvider(
  wallet: "metamask" | "okx"
) {
  const providers =
    await discoverProviders();

  if (wallet === "metamask") {
    const provider =
      providers.find(
        isMetaMaskProvider
      );

    if (provider) {
      return provider.provider;
    }
  }

  if (wallet === "okx") {
    const provider =
      providers.find(
        isOKXProvider
      );

    if (provider) {
      return provider.provider;
    }
  }

  const ethereum =
    ethereumProvider();

  if (!ethereum) {
    return null;
  }

  if (
    Array.isArray(
      ethereum.providers
    )
  ) {
    if (wallet === "metamask") {
      return (
        ethereum.providers.find(
          (provider) =>
            provider.isMetaMask === true &&
            provider.isOkxWallet !== true &&
            provider.isOKExWallet !== true &&
            provider.isOKXWallet !== true
        ) ?? null
      );
    }

    if (wallet === "okx") {
      return (
        ethereum.providers.find(
          (provider) =>
            provider.isOkxWallet === true ||
            provider.isOKExWallet === true ||
            provider.isOKXWallet === true
        ) ?? null
      );
    }
  }

  if (
    wallet === "metamask" &&
    ethereum.isMetaMask
  ) {
    return ethereum;
  }

  if (
    wallet === "okx" &&
    (
      ethereum.isOkxWallet ||
      ethereum.isOKExWallet ||
      ethereum.isOKXWallet
    )
  ) {
    return ethereum;
  }

  return null;
}

async function getFreshEvmAccount(
  provider: Eip1193Provider,
  requestPermission = true
) {
  let accounts =
    await provider.request({
      method: "eth_accounts",
    });

  if (
    requestPermission &&
    (!Array.isArray(accounts) ||
      accounts.length === 0)
  ) {
    accounts =
      await provider.request({
        method: "eth_requestAccounts",
      });
  }

  const address =
    Array.isArray(accounts)
      ? accounts[0]
      : null;

  if (!address) {
    throw new Error(
      "Wallet tidak memberikan address."
    );
  }

  return address;
}

async function replaceEvmWallet(
  userId: string,
  address: string
) {
  const supabase =
    createClient();

  const { data: wallets, error } =
    await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .in("chain", ["bsc", "base"]);

  if (error) {
    throw error;
  }

  const ids =
    wallets?.map(
      (wallet) => wallet.id
    ) ?? [];

  if (ids.length > 0) {
    const { error: balanceError } =
      await supabase
        .from("wallet_balances")
        .delete()
        .in("wallet_id", ids);

    if (balanceError) {
      throw balanceError;
    }

    const { error: deleteError } =
      await supabase
        .from("wallets")
        .delete()
        .eq("user_id", userId)
        .in("chain", ["bsc", "base"]);

    if (deleteError) {
      throw deleteError;
    }
  }

  const { error: insertError } =
    await supabase
      .from("wallets")
      .insert([
        {
          user_id: userId,
          chain: "bsc",
          address,
        },
        {
          user_id: userId,
          chain: "base",
          address,
        },
      ]);

  if (insertError) {
    throw insertError;
  }
}

async function replaceSolanaWallet(
  userId: string,
  address: string
) {
  const supabase =
    createClient();

  const { data: wallets, error } =
    await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .eq("chain", "solana");

  if (error) {
    throw error;
  }

  const ids =
    wallets?.map(
      (wallet) => wallet.id
    ) ?? [];

  if (ids.length > 0) {
    const { error: balanceError } =
      await supabase
        .from("wallet_balances")
        .delete()
        .in("wallet_id", ids);

    if (balanceError) {
      throw balanceError;
    }

    const { error: deleteError } =
      await supabase
        .from("wallets")
        .delete()
        .eq("user_id", userId)
        .eq("chain", "solana");

    if (deleteError) {
      throw deleteError;
    }
  }

  const { error: insertError } =
    await supabase
      .from("wallets")
      .insert({
        user_id: userId,
        chain: "solana",
        address,
      });

  if (insertError) {
    throw insertError;
  }
}

async function connectEVM(
  wallet: "metamask" | "okx",
  userId: string
) {
  const provider =
    await getEvmProvider(wallet);

  if (!provider) {
    throw new Error(
      wallet === "okx"
        ? "OKX Wallet tidak terdeteksi."
        : "MetaMask tidak terdeteksi."
    );
  }

  const address =
    await getFreshEvmAccount(
      provider,
      true
    );

  const ethersProvider =
    new BrowserProvider(
      provider
    );

  const signer =
    await ethersProvider.getSigner();

  const message =
    `ChainMarket Wallet Verification\n\n` +
    `User ID: ${userId}\n` +
    `Wallet: ${address}\n\n` +
    `Sign this message to verify ownership of this wallet.`;

  await signer.signMessage(
    message
  );

  await replaceEvmWallet(
    userId,
    address
  );

  return {
    provider,
    address,
  };
}

async function connectSolana(
  userId: string
) {
  const provider =
    phantomProvider() ??
    solanaProvider();

  if (!provider) {
    throw new Error(
      "Phantom Wallet tidak terdeteksi."
    );
  }

  const result =
    provider.publicKey
      ? {
          publicKey:
            provider.publicKey,
        }
      : await provider.connect();

  const address =
    result.publicKey.toString();

  const message =
    `ChainMarket Wallet Verification\n\n` +
    `User ID: ${userId}\n` +
    `Wallet: ${address}\n\n` +
    `Sign this message to verify ownership of this wallet.`;

  await provider.signMessage(
    new TextEncoder().encode(
      message
    ),
    "utf8"
  );

  await replaceSolanaWallet(
    userId,
    address
  );

  return {
    provider,
    address,
  };
}

function shortenAddress(
  address: string
) {
  if (!address) {
    return "";
  }

  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(
    0,
    6
  )}...${address.slice(-6)}`;
}

export default function WalletConnectButton({
  onConnected,
  onDisconnected,
  connected = false,
}: WalletConnectButtonProps) {
  const { user } =
    useAuth();

  const [open, setOpen] =
    useState(false);

  const [connecting, setConnecting] =
    useState<WalletType | null>(
      null
    );

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [activeWallet, setActiveWallet] =
    useState<WalletType | null>(
      null
    );

  const [activeAddress, setActiveAddress] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    const handler =
      (event: MouseEvent) => {
        const target =
          event.target as HTMLElement;

        if (
          !target.closest(
            "[data-wallet-connect-menu]"
          )
        ) {
          setOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handler
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;

    let cancelled = false;

    async function restoreWallet() {
      try {
        // Restore EVM wallet
        for (const wallet of ["metamask", "okx"] as const) {
          if (cancelled) return;

          try {
            const provider = await getEvmProvider(wallet);

            if (!provider) continue;

            const accounts = await provider.request({
              method: "eth_accounts",
            });

            const address =
              Array.isArray(accounts) && accounts.length > 0
                ? accounts[0]
                : null;

            if (!address) continue;

            if (cancelled) return;

            setError(null);
            setActiveWallet(wallet);
            setActiveAddress(address);


            if (cancelled) return;

            window.dispatchEvent(
              new CustomEvent("chainmarket:wallet-changed", {
                detail: {
                  wallet,
                  address,
                },
              })
            );

            await onConnected?.({
              wallet,
              address,
            });

            return;
          } catch (err) {
            console.warn(
              `Failed to restore ${wallet}:`,
              err
            );
          }
        }

        // Restore Solana wallet
        const solanaWallets = [
          phantomProvider(),
          solanaProvider(),
          okxSolanaProvider(),
        ];

        for (const provider of solanaWallets) {
          if (cancelled || !provider) continue;

          const address =
            provider.publicKey?.toString() ?? null;

          if (!address) continue;

          setError(null);
          setActiveWallet("phantom");
          setActiveAddress(address);

          window.dispatchEvent(
            new CustomEvent("chainmarket:wallet-changed", {
              detail: {
                wallet: "phantom",
                address,
              },
            })
          );

          await onConnected?.({
            wallet: "phantom",
            address,
          });

          return;
        }
      } catch (err) {
        console.error(
          "Wallet restore error:",
          err
        );
      }
    }

    restoreWallet();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !activeWallet) {
      return;
    }

    const wallet = activeWallet;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function setup() {
      if (wallet === "phantom") {
        return;
      }

      const provider = await getEvmProvider(wallet);

      if (!provider || cancelled) {
        return;
      }

      const handleAccountsChanged =
        async (
          accounts: string[]
        ) => {
          if (!user) return;

          const newAddress =
            accounts?.[0] ?? null;

          if (!newAddress) {
            setActiveAddress(null);
            setActiveWallet(null);

            window.dispatchEvent(
              new CustomEvent(
                "chainmarket:wallet-changed",
                {
                  detail: {
                    wallet,
                    address: null,
                  },
                }
              )
            );

            await onDisconnected?.(wallet);
            return;
          }

          try {
            setError(null);

            await replaceEvmWallet(
              user.id,
              newAddress
            );

            if (cancelled) {
              return;
            }

            setActiveAddress(
              newAddress
            );

            window.dispatchEvent(
              new CustomEvent(
                "chainmarket:wallet-changed",
                {
                  detail: {
                    wallet,
                    address:
                      newAddress,
                  },
                }
              )
            );

            await onConnected?.({
              wallet,
              address:
                newAddress,
            });
          } catch (err) {
            console.error(
              err
            );

            setError(
              err instanceof Error
                ? err.message
                : "Gagal memperbarui wallet."
            );
          }
        };

      provider.on?.(
        "accountsChanged",
        handleAccountsChanged
      );

      cleanup = () => {
        provider.removeListener?.(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }

    setup();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [
    user,
    activeWallet,
    onConnected,
    onDisconnected,
  ]);

  async function handleDisconnect(
    wallet: WalletType
  ) {
    if (!user) {
      setError(
        "Login terlebih dahulu."
      );
      return;
    }

    setError(null);
    setConnecting(wallet);

    try {
      const supabase =
        createClient();

      const {
        data: wallets,
        error: walletError,
      } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id);

      if (walletError) {
        throw walletError;
      }

      const ids =
        wallets?.map(
          (item) => item.id
        ) ?? [];

      if (ids.length > 0) {
        const {
          error:
            balanceDeleteError,
        } = await supabase
          .from("wallet_balances")
          .delete()
          .in(
            "wallet_id",
            ids
          );

        if (
          balanceDeleteError
        ) {
          throw balanceDeleteError;
        }
      }

      const {
        error: deleteError,
      } = await supabase
        .from("wallets")
        .delete()
        .eq(
          "user_id",
          user.id
        );

      if (deleteError) {
        throw deleteError;
      }

      const solanaProviders = [
        okxSolanaProvider(),
        phantomProvider(),
        solanaProvider(),
      ];

      for (
        const provider of solanaProviders
      ) {
        try {
          await provider?.disconnect?.();
        } catch {}
      }

      setActiveWallet(null);
      setActiveAddress(null);
      setOpen(false);

      await onDisconnected?.(
        wallet
      );
    } catch (err) {
      console.error(
        "Wallet disconnect error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal disconnect wallet."
      );
    } finally {
      setConnecting(null);
    }
  }

  async function handleConnect(
    wallet: WalletType
  ) {
    if (!user) {
      setError(
        "Login terlebih dahulu sebelum connect wallet."
      );
      return;
    }

    if (connecting) {
      return;
    }

    setError(null);
    setConnecting(wallet);

    try {
      let address = "";

      if (
        wallet === "metamask" ||
        wallet === "okx"
      ) {
        const result =
          await connectEVM(
            wallet,
            user.id
          );

        address =
          result.address;
      } else {
        const result =
          await connectSolana(
            user.id
          );

        address =
          result.address;
      }

      setActiveWallet(
        wallet
      );

      setActiveAddress(
        address
      );

      setOpen(false);

      await onConnected?.({
        wallet,
        address,
      });
    } catch (err) {
      console.error(
        "Wallet connection error:",
        err
      );

      const walletError =
        err as {
          code?: number;
          message?: string;
        };

      if (
        walletError.code ===
        -32002
      ) {
        setError(
          "Masih ada request wallet yang pending. Buka wallet extension lalu selesaikan request sebelumnya."
        );
      } else if (
        walletError.code ===
        4001
      ) {
        setError(
          "Request wallet dibatalkan."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal connect wallet."
        );
      }
    } finally {
      setConnecting(null);
    }
  }

  const isConnected =
    Boolean(
      activeWallet &&
      activeAddress
    );

  return (
    <div
      className="relative"
      data-wallet-connect-menu
    >
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(
            (value) => !value
          );
        }}
        disabled={
          connecting !== null
        }
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {connecting ? (
          `Connecting ${
            connecting === "metamask"
              ? "MetaMask"
              : connecting === "okx"
                ? "OKX Wallet"
                : "Phantom"
          }...`
        ) : isConnected ? (
          <>
            <span className="h-2 w-2 rounded-full bg-green-300" />
            {shortenAddress(
              activeAddress!
            )}
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {isConnected && (
            <>
              <div className="mb-2 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Wallet Aktif
                  </span>

                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    Connected
                  </span>
                </div>

                <div className="mb-2 text-sm font-semibold">
                  {activeWallet ===
                  "metamask"
                    ? "🦊 MetaMask"
                    : activeWallet ===
                        "okx"
                      ? "◈ OKX Wallet"
                      : "👻 Phantom"}
                </div>

                <div className="break-all rounded-md bg-white px-2 py-2 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {activeAddress}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(
                        activeAddress!
                      )
                      .then(() => {
                        setError(
                          "Address berhasil dicopy."
                        );
                      })
                      .catch(() => {});
                  }}
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold transition hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700"
                >
                  📋 Copy Address
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "Disconnect wallet dari ChainMarket?"
                    )
                  ) {
                    handleDisconnect(
                      activeWallet ??
                        "metamask"
                    );
                  }
                }}
                disabled={
                  connecting !== null
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
              >
                <span className="text-xl">
                  🔌
                </span>

                <span>
                  <span className="block font-semibold text-red-600 dark:text-red-400">
                    Disconnect Wallet
                  </span>

                  <span className="text-xs text-zinc-500">
                    Hapus koneksi dari ChainMarket
                  </span>
                </span>
              </button>

              <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
            </>
          )}

          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {isConnected
              ? "Ganti Wallet"
              : "Connect dengan"}
          </p>

          {(
            [
              [
                "metamask",
                "🦊",
                "MetaMask",
                "EVM Wallet",
              ],
              [
                "okx",
                "◈",
                "OKX Wallet",
                "EVM + Solana",
              ],
              [
                "phantom",
                "👻",
                "Phantom",
                "Solana Wallet",
              ],
            ] as const
          ).map(
            ([
              type,
              icon,
              name,
              description,
            ]) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  handleConnect(
                    type
                  )
                }
                disabled={
                  connecting !== null
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                <span className="text-xl">
                  {icon}
                </span>

                <span>
                  <span className="block font-semibold">
                    {name}
                  </span>

                  <span className="text-xs text-zinc-500">
                    {description}
                  </span>
                </span>
              </button>
            )
          )}

          {error && (
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                error.includes(
                  "dicopy"
                )
                  ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                  : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              }`}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

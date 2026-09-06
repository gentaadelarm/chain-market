"use client";

import AccountDashboardShell from "@/components/AccountDashboardShell";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import WalletConnectButton from "@/components/WalletConnectButton";
import WithdrawModal from "@/components/WithdrawModal";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [walletBalances, setWalletBalances] = useState<
    Array<{
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
        chain:
          | "ethereum"
          | "bsc"
          | "base"
          | "polygon"
          | "arbitrum"
          | "optimism"
          | "avalanche"
          | "solana";
        network:
          | "eth-mainnet"
          | "bnb-mainnet"
          | "base-mainnet"
          | "polygon-mainnet"
          | "arb-mainnet"
          | "opt-mainnet"
          | "avax-mainnet"
          | "sol-mainnet";
        contract_address: string | null;
        decimals: number;
        is_native: boolean;
        logo_url: string | null;
      } | null;
    }>
  >([]);
  const [scanningWallet, setScanningWallet] = useState(false);
  const [walletScanMessage, setWalletScanMessage] = useState("");
  const [showAllWalletTokens, setShowAllWalletTokens] = useState(false);

  const [connectedEvmAddress, setConnectedEvmAddress] =
    useState<string | null>(null);

  const [connectedSolanaAddress, setConnectedSolanaAddress] =
    useState<string | null>(null);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [receiveNetwork, setReceiveNetwork] = useState<
    "evm" | "solana"
  >("evm");
  const [copiedReceiveAddress, setCopiedReceiveAddress] =
    useState(false);

  useEffect(() => {
    if (!user) return;

    setAvatarUrl(
      (user.user_metadata?.avatar_url as string | undefined) ?? null
    );

    const savedTheme = localStorage.getItem("chain-market-theme");
    setDarkMode(savedTheme === "dark");
  }, [user]);

  const userCode =
    (user?.user_metadata?.user_code as string | undefined) ??
    user?.id?.slice(0, 12) ??
    "--------";

  const initials =
    user?.email?.charAt(0).toUpperCase() ?? "U";

  const handleTheme = (dark: boolean) => {
    setDarkMode(dark);
    localStorage.setItem("chain-market-theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  };

  const restoreWalletConnections = async () => {
    if (!user) return;

    try {
      const { data: wallets, error } = await supabase
        .from("wallets")
        .select("chain,address")
        .eq("user_id", user.id);

      if (error) {
        console.error("Gagal restore wallet:", error);
        return;
      }

      const evmWallet =
        wallets?.find(
          (wallet) =>
            wallet.chain === "bsc" ||
            wallet.chain === "base"
        )?.address ?? null;

      const solanaWallet =
        wallets?.find(
          (wallet) => wallet.chain === "solana"
        )?.address ?? null;

      setConnectedEvmAddress(evmWallet);
      setConnectedSolanaAddress(solanaWallet);
    } catch (error) {
      console.error("Gagal restore wallet:", error);
    }
  };

  const scanWalletBalances = async () => {
    if (!user) return;

    // Jangan scan kalau tidak ada wallet yang sedang terhubung
    if (
      connectedEvmAddress === null &&
      connectedSolanaAddress === null
    ) {
      setWalletBalances([]);
      setWalletScanMessage("");
      return;
    }

    setScanningWallet(true);
    setWalletScanMessage("");

    try {
      const response = await fetch("/api/wallet/balances", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Gagal membaca balance wallet.");
      }

      setWalletBalances(data?.balances ?? []);
      setWalletScanMessage("");
    } catch (error) {
      console.error(error);
      setWalletScanMessage(
        "Gagal membaca balance wallet. Coba refresh lagi."
      );
    } finally {
      setScanningWallet(false);
    }
  };


  useEffect(() => {
    if (!user) return;

    const source = new EventSource("/api/wallet/stream");

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWalletChange = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);

        if (
          payload.type !== "wallet-change" ||
          payload.reason === "heartbeat"
        ) {
          return;
        }

        // Debounce beberapa event dari block/log yang sama
        // supaya satu transfer tidak memicu scan berkali-kali.
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        refreshTimer = setTimeout(() => {
          scanWalletBalances();
        }, 50);
      } catch (error) {
        console.error(
          "Wallet realtime event error:",
          error
        );
      }
    };

    source.addEventListener(
      "message",
      handleWalletChange
    );

    source.onerror = () => {
      // EventSource akan otomatis mencoba reconnect.
      // Tidak ada polling tambahan di sini.
    };

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      source.close();
    };
  }, [user, connectedEvmAddress, connectedSolanaAddress]);

  useEffect(() => {
    if (!user) return;

    const initializeWallets = async () => {
      await restoreWalletConnections();
    };

    initializeWallets();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (
      connectedEvmAddress === null &&
      connectedSolanaAddress === null
    ) {
      setWalletBalances([]);
      return;
    }

    scanWalletBalances();
  }, [user, connectedEvmAddress, connectedSolanaAddress]);

  const formatTokenBalance = (balance: string) => {
    return Number(balance).toLocaleString("en-US", {
      maximumFractionDigits: 8,
    });
  };

  const formatUsd = (value: number) => {
    if (!Number.isFinite(value)) {
      return "$0.00";
    }

    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const receiveAddress =
    receiveNetwork === "solana"
      ? connectedSolanaAddress
      : connectedEvmAddress;

  const receiveNetworkLabel =
    receiveNetwork === "solana"
      ? "Solana"
      : "EVM Network";

  const copyReceiveAddress = async () => {
    if (!receiveAddress) return;

    try {
      await navigator.clipboard.writeText(receiveAddress);
      setCopiedReceiveAddress(true);

      window.setTimeout(() => {
        setCopiedReceiveAddress(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Gagal copy receive address:",
        error
      );
    }
  };

  const chainLabel = (chain: string) => {
    if (chain === "ethereum") return "Ethereum";
    if (chain === "bsc") return "BNB Smart Chain";
    if (chain === "base") return "Base";
    if (chain === "polygon") return "Polygon";
    if (chain === "arbitrum") return "Arbitrum";
    if (chain === "optimism") return "Optimism";
    if (chain === "avalanche") return "Avalanche";
    if (chain === "solana") return "Solana";
    return chain;
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ukuran foto maksimal 5 MB.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setMessage("Foto profil berhasil diperbarui.");
    } catch (error) {
      console.error(error);
      setMessage(
        "Upload gagal. Pastikan Supabase Storage memiliki bucket bernama avatars."
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] text-zinc-900 dark:bg-[#070b12] dark:text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="rounded-2xl border border-blue-100 bg-white px-6 py-5 text-sm text-zinc-500 shadow-sm dark:border-blue-500/10 dark:bg-[#0d131f] dark:text-zinc-400">
            Memuat akun...
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] text-zinc-900 dark:bg-[#070b12] dark:text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-3xl border border-blue-100 bg-white p-10 shadow-xl dark:border-blue-500/10 dark:bg-[#0d131f]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-3xl">
              👤
            </div>
            <h1 className="mt-5 text-2xl font-black">Login diperlukan</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Silakan login untuk membuka akun kamu.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const positiveBalances = walletBalances.filter(
    (item) =>
      item.asset &&
      Number(item.balance) > 0 &&
      Number.isFinite(Number(item.value_usd)) &&
      Number(item.value_usd) > 0
  );

  return (
    <AccountDashboardShell
      darkMode={darkMode}
      avatarUrl={avatarUrl}
      initials={initials}
      email={user.email}
      walletAddress={connectedEvmAddress ?? connectedSolanaAddress}
    >
      <div className="mx-auto max-w-[1100px] px-4 py-5 lg:px-6">

        {/* PAGE HEADER */}
        <div className="mb-5">
          <h1 className="text-[18px] font-bold tracking-tight">
            My Account
          </h1>
          <p className="mt-1 text-[9px] text-zinc-500">
            Manage your assets, wallet and account settings.
          </p>
        </div>

        {/* BALANCE GRID */}
        <div className="grid gap-3 lg:grid-cols-2">

          {/* PLATFORM BALANCE */}
          <section
            className={`rounded-[9px] border p-4 ${
              darkMode
                ? "border-[#1b2a3a] bg-[#0c141e]"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                ▱
              </div>

              <div>
                <h2 className="text-[10px] font-bold">
                  Platform Balance
                </h2>
                <p className="mt-0.5 text-[8px] text-zinc-500">
                  Balance managed by ChainMarket.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[22px] font-bold tracking-tight">
                $0.00
              </p>

              <p className="mt-1 text-[8px] text-zinc-500">
                0.0000 USDT
              </p>
            </div>
          </section>

          {/* CONNECTED WALLET */}
          <section
            className={`rounded-[9px] border p-4 ${
              darkMode
                ? "border-[#1b2a3a] bg-[#0c141e]"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                  ▭
                </div>

                <div>
                  <h2 className="text-[10px] font-bold">
                    Connected Wallet Balance
                  </h2>
                  <p className="mt-0.5 text-[8px] text-zinc-500">
                    Your assets in connected wallet.
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      connectedEvmAddress &&
                      !connectedSolanaAddress
                    ) {
                      setReceiveNetwork("evm");
                    } else if (
                      connectedSolanaAddress &&
                      !connectedEvmAddress
                    ) {
                      setReceiveNetwork("solana");
                    }

                    setCopiedReceiveAddress(false);
                    setReceiveOpen(true);
                  }}
                  disabled={
                    !connectedEvmAddress &&
                    !connectedSolanaAddress
                  }
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-[8px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↓ Deposit
                </button>

                <button
                  type="button"
                  onClick={() => setWithdrawOpen(true)}
                  disabled={
                    !connectedEvmAddress &&
                    !connectedSolanaAddress
                  }
                  className={`rounded-md border px-3 py-1.5 text-[8px] font-bold ${
                    darkMode
                      ? "border-[#2a3b4f] text-zinc-300 hover:bg-[#15202c]"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  ↑ Withdraw
                </button>

                <button
                  type="button"
                  onClick={scanWalletBalances}
                  disabled={scanningWallet}
                  className={`flex h-[25px] w-[25px] items-center justify-center rounded-md border text-[11px] ${
                    darkMode
                      ? "border-[#2a3b4f] text-zinc-400 hover:bg-[#15202c]"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  {scanningWallet ? "…" : "↻"}
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-2">
              <p className="text-[22px] font-bold tracking-tight">
                {formatUsd(
                  walletBalances.reduce(
                    (sum, item) =>
                      sum +
                      (Number.isFinite(item.value_usd)
                        ? item.value_usd
                        : 0),
                    0
                  )
                )}
              </p>

              <span className="pb-1 text-[8px] text-zinc-500">
                Portfolio Value
              </span>
            </div>

            {/* ASSETS */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["ETH", "USDT", "SOL"].map((symbol) => {
                const item = positiveBalances.find(
                  (entry) =>
                    entry.asset?.symbol?.toUpperCase() === symbol
                );

                return (
                  <div
                    key={symbol}
                    className={`rounded-md border px-2.5 py-2 ${
                      darkMode
                        ? "border-[#1c2a39] bg-[#101923]"
                        : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold">
                        {symbol}
                      </span>

                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item
                            ? "bg-emerald-500"
                            : "bg-zinc-500"
                        }`}
                      />
                    </div>

                    <p className="mt-1 text-[8px] text-zinc-500">
                      {item
                        ? formatTokenBalance(item.balance)
                        : "0.0000"}
                    </p>

                    <p className="mt-1 text-[8px] font-bold">
                      {item
                        ? formatUsd(item.value_usd)
                        : "$0.00"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* AVAILABLE WALLET TOKENS */}
        <section
          className={`mt-3 overflow-hidden rounded-[9px] border ${
            darkMode
              ? "border-[#1b2a3a] bg-[#0c141e]"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div
            className={`flex min-h-[42px] items-center justify-between gap-3 border-b px-4 py-2 ${
              darkMode ? "border-[#172535]" : "border-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-blue-500">◈</span>
              <div>
                <h2 className="text-[10px] font-bold">
                  Available Wallet Tokens
                </h2>
                <p className="mt-0.5 text-[7px] text-zinc-500">
                  Assets detected from your connected wallet.
                </p>
              </div>
            </div>

            <span className="rounded-md bg-blue-500/10 px-2 py-1 text-[7px] font-bold text-blue-500">
              {positiveBalances.length} token
              {positiveBalances.length !== 1 ? "s" : ""}
            </span>
          </div>

          {positiveBalances.length === 0 ? (
            <div className="flex min-h-[100px] items-center justify-center px-4 text-center">
              <div>
                <div className="text-lg opacity-40">◈</div>
                <p className="mt-2 text-[8px] font-semibold text-zinc-500">
                  {scanningWallet
                    ? "Scanning wallet..."
                    : connectedEvmAddress || connectedSolanaAddress
                      ? "No token balance detected."
                      : "Connect a wallet to view your tokens."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className={darkMode ? "bg-[#0a1119]" : "bg-zinc-50"}>
                    {["Token", "Network", "Balance", "Price", "Value"].map(
                      (title) => (
                        <th
                          key={title}
                          className="px-4 py-2 text-left text-[7px] font-bold uppercase tracking-wider text-zinc-500"
                        >
                          {title}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {(showAllWalletTokens
                    ? positiveBalances
                    : positiveBalances.slice(0, 10)
                  ).map((item) => {
                    if (!item.asset) return null;

                    const symbol =
                      item.asset.symbol?.toUpperCase() || "UNKNOWN";
                    const name = item.asset.name || symbol;

                    return (
                      <tr
                        key={`${item.wallet_id}-${item.asset_id}`}
                        className={`border-t ${
                          darkMode
                            ? "border-[#172535] hover:bg-[#101923]"
                            : "border-zinc-100 hover:bg-zinc-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {item.asset.logo_url ? (
                              <img
                                src={item.asset.logo_url}
                                alt={symbol}
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[8px] font-bold ${
                                  darkMode
                                    ? "bg-[#182433] text-zinc-300"
                                    : "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                {symbol.slice(0, 2)}
                              </div>
                            )}

                            <div>
                              <p className="text-[9px] font-bold">{symbol}</p>
                              <p className="mt-0.5 text-[7px] text-zinc-500">
                                {name}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md px-2 py-1 text-[7px] font-semibold ${
                              darkMode
                                ? "bg-[#15202c] text-zinc-300"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {chainLabel(item.asset.chain)}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-[8px] font-semibold">
                            {formatTokenBalance(item.balance)}
                          </p>
                          <p className="mt-0.5 text-[7px] text-zinc-500">
                            {symbol}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-[8px] font-semibold">
                            {formatUsd(item.price_usd)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-[9px] font-bold text-emerald-500">
                            {formatUsd(item.value_usd)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {positiveBalances.length > 10 && (
                <div
                  className={`flex items-center justify-center border-t px-4 py-2.5 ${
                    darkMode
                      ? "border-[#172535]"
                      : "border-zinc-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowAllWalletTokens((current) => !current)
                    }
                    className="text-[8px] font-bold text-blue-500 transition hover:text-blue-400"
                  >
                    {showAllWalletTokens
                      ? "View Less ↑"
                      : `View More (${positiveBalances.length - 10}) →`}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* RECENT TRANSACTIONS */}
        <section
          className={`mt-3 overflow-hidden rounded-[9px] border ${
            darkMode
              ? "border-[#1b2a3a] bg-[#0c141e]"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div
            className={`flex h-[42px] items-center justify-between border-b px-4 ${
              darkMode
                ? "border-[#172535]"
                : "border-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-blue-500">
                ◷
              </span>

              <h2 className="text-[10px] font-bold">
                Recent Transactions
              </h2>
            </div>

            <button
              type="button"
              className="text-[8px] font-semibold text-blue-500 hover:text-blue-400"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr
                  className={
                    darkMode
                      ? "bg-[#0a1119]"
                      : "bg-zinc-50"
                  }
                >
                  {[
                    "Date",
                    "Type",
                    "Asset",
                    "Amount",
                    "Status",
                    "Tx Hash",
                  ].map((title) => (
                    <th
                      key={title}
                      className="px-4 py-2 text-left text-[7px] font-bold uppercase tracking-wider text-zinc-500"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="h-[90px] text-center text-[8px] text-zinc-500"
                  >
                    No transactions yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* WALLET CONNECTION */}
        <section
          className={`mt-3 rounded-[9px] border p-4 ${
            darkMode
              ? "border-[#1b2a3a] bg-[#0c141e]"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[10px] font-bold">
                Wallet Connection
              </h2>
              <p className="mt-0.5 text-[8px] text-zinc-500">
                Connect MetaMask, OKX or Phantom to manage your
                blockchain assets.
              </p>
            </div>

            <div className="shrink-0">
              <WalletConnectButton
                connected={
                  connectedEvmAddress !== null ||
                  connectedSolanaAddress !== null
                }
                onConnected={async ({ wallet, address }) => {
                  if (
                    wallet === "metamask" ||
                    wallet === "okx"
                  ) {
                    setConnectedEvmAddress(address);
                  } else {
                    setConnectedSolanaAddress(address);
                  }
                }}
                onDisconnected={async () => {
                  setConnectedEvmAddress(null);
                  setConnectedSolanaAddress(null);
                  setWalletBalances([]);
                  setWalletScanMessage(
                    "Wallet berhasil di-disconnect."
                  );
                }}
              />
            </div>
          </div>
        </section>

        {/* ACCOUNT SETTINGS */}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Link
            href="/account/settings"
            className={`rounded-[9px] border p-4 transition hover:-translate-y-0.5 ${
              darkMode
                ? "border-[#1b2a3a] bg-[#0c141e] hover:border-blue-500/30"
                : "border-zinc-200 bg-white hover:border-blue-200"
            }`}
          >
            <span className="text-[13px] text-blue-500">♙</span>
            <p className="mt-2 text-[9px] font-bold">Profile</p>
            <p className="mt-1 text-[7px] text-zinc-500">
              Manage your account
            </p>
          </Link>

          <Link
            href="/account/settings"
            className={`rounded-[9px] border p-4 transition hover:-translate-y-0.5 ${
              darkMode
                ? "border-[#1b2a3a] bg-[#0c141e] hover:border-blue-500/30"
                : "border-zinc-200 bg-white hover:border-blue-200"
            }`}
          >
            <span className="text-[13px] text-blue-500">⚙</span>
            <p className="mt-2 text-[9px] font-bold">Settings</p>
            <p className="mt-1 text-[7px] text-zinc-500">
              Account preferences
            </p>
          </Link>

          <Link
            href="/account/kyc"
            className={`rounded-[9px] border p-4 transition hover:-translate-y-0.5 ${
              darkMode
                ? "border-[#1b2a3a] bg-[#0c141e] hover:border-blue-500/30"
                : "border-zinc-200 bg-white hover:border-blue-200"
            }`}
          >
            <span className="text-[13px] text-blue-500">▣</span>
            <p className="mt-2 text-[9px] font-bold">KYC</p>
            <p className="mt-1 text-[7px] text-zinc-500">
              Verification status
            </p>
          </Link>
        </div>
      </div>

      {/* RECEIVE MODAL */}
      {receiveOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setReceiveOpen(false);
            }
          }}
        >
          <div
            className={`w-full max-w-[390px] rounded-xl border p-5 shadow-2xl ${
              darkMode
                ? "border-[#243447] bg-[#0c141e] text-white"
                : "border-zinc-200 bg-white text-zinc-950"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-blue-500">
                  Wallet
                </p>
                <h3 className="mt-1 text-[15px] font-bold">
                  Receive / Deposit
                </h3>
                <p className="mt-1 text-[8px] text-zinc-500">
                  Send assets to your connected wallet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReceiveOpen(false)}
                className="text-lg text-zinc-500 hover:text-white"
              >
                ×
              </button>
            </div>

            {connectedEvmAddress && connectedSolanaAddress && (
              <div className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-zinc-100 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setReceiveNetwork("evm");
                    setCopiedReceiveAddress(false);
                  }}
                  className={`rounded px-2 py-1.5 text-[8px] font-bold ${
                    receiveNetwork === "evm"
                      ? "bg-white shadow dark:bg-zinc-700"
                      : "text-zinc-500"
                  }`}
                >
                  EVM
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReceiveNetwork("solana");
                    setCopiedReceiveAddress(false);
                  }}
                  className={`rounded px-2 py-1.5 text-[8px] font-bold ${
                    receiveNetwork === "solana"
                      ? "bg-white shadow dark:bg-zinc-700"
                      : "text-zinc-500"
                  }`}
                >
                  Solana
                </button>
              </div>
            )}

            {!receiveAddress ? (
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[8px] text-amber-600">
                Connect wallet terlebih dahulu untuk menerima aset.
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                  <p className="text-[7px] font-bold uppercase text-amber-600">
                    Network
                  </p>
                  <p className="mt-1 text-[9px] font-bold">
                    {receiveNetworkLabel}
                  </p>
                  <p className="mt-1 text-[7px] leading-4 text-amber-700 dark:text-amber-500">
                    Pastikan pengirim menggunakan network yang sesuai.
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-[7px] font-bold uppercase text-zinc-500">
                    Wallet Address
                  </p>

                  <div
                    className={`mt-1 break-all rounded-lg border p-3 font-mono text-[8px] leading-4 ${
                      darkMode
                        ? "border-[#253447] bg-[#080e16]"
                        : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    {receiveAddress}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyReceiveAddress}
                  className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2.5 text-[8px] font-bold text-white hover:bg-blue-700"
                >
                  {copiedReceiveAddress
                    ? "Address Copied ✓"
                    : "Copy Address"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <WithdrawModal
        open={withdrawOpen}
        darkMode={darkMode}
        balances={walletBalances}
        connectedEvmAddress={connectedEvmAddress}
        connectedSolanaAddress={connectedSolanaAddress}
        onClose={() => setWithdrawOpen(false)}
      />
    </AccountDashboardShell>
  );

}

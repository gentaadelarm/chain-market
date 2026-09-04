"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Coin = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  marketCap: number;
  volume24h: number;
  change1h: number;
  change24h: number;
  change7d: number;
  lastUpdated: string | null;
};

export default function BlockchainPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const savedTheme = localStorage.getItem("chain-market-theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
    } else if (savedTheme === "light") {
      setDarkMode(false);
    } else {
      setDarkMode(
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);
    };

    loadUser();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem(
      "chain-market-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode, mounted]);

  useEffect(() => {
    const loadMarket = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/market");

        if (!response.ok) {
          throw new Error("Failed to load market");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load market");
        }

        setCoins(result.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data market.");
      } finally {
        setLoading(false);
      }
    };

    loadMarket();

    const interval = setInterval(loadMarket, 30000);

    return () => clearInterval(interval);
  }, []);

  const theme = darkMode
    ? {
        page: "bg-slate-950 text-white",
        header: "border-slate-800 bg-slate-950",
        muted: "text-slate-400",
        softHover: "hover:bg-slate-800",
        input: "border-slate-700 bg-slate-900",
        card: "border-slate-800 bg-slate-900",
        rowHover: "hover:bg-slate-800/60",
      }
    : {
        page: "bg-slate-50 text-slate-900",
        header: "border-slate-200 bg-white",
        muted: "text-slate-600",
        softHover: "hover:bg-slate-100",
        input: "border-slate-200 bg-white",
        card: "border-slate-200 bg-white",
        rowHover: "hover:bg-slate-50",
      };

  const filteredCoins = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return coins;

    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );
  }, [coins, search]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
    }

    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })}`;
  };

  const formatCompact = (value: number) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    }

    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    }

    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    }

    if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }

    return `$${value.toFixed(2)}`;
  };

  const changeClass = (value: number) =>
    value >= 0 ? "text-green-600" : "text-red-500";

  return (
    <main className={`min-h-screen ${theme.page}`}>
      {/* TOP BAR */}
      <div className={`hidden border-b md:block ${theme.header}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link
              href="/account"
              className={`font-semibold ${theme.softHover}`}
            >
              Seller Center
            </Link>

            <span className={theme.muted}>
              Mulai berjualan di ChainMarket
            </span>

            <span className={theme.muted}>Bantuan</span>
            <span className={theme.muted}>Bahasa</span>
          </div>

          {userEmail ? (
            <Link
              href="/account"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {userEmail}
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className={`border-b ${theme.header}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight sm:text-2xl"
          >
            Chain<span className="text-blue-600">Market</span>
          </Link>

          {/* SEARCH */}
          <div className="hidden min-w-0 flex-1 md:block">
            <div
              className={`flex h-11 items-center rounded-xl border px-4 ${theme.input}`}
            >
              <span className="mr-3 text-lg">⌕</span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari coin atau token..."
                className={`w-full bg-transparent text-sm outline-none ${
                  darkMode
                    ? "placeholder:text-slate-500"
                    : "placeholder:text-slate-400"
                }`}
              />
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme.softHover}`}
            >
              Ecommerce
            </Link>

            <Link
              href="/blockchain"
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Blockchain
            </Link>

            <Link
              href="/staking"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme.softHover}`}
            >
              Staking
            </Link>

            <Link
              href="/#products"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme.softHover}`}
            >
              Categories
            </Link>
          </nav>

          {/* CART */}
          <Link
            href="/"
            className={`rounded-xl p-2.5 text-xl transition-colors ${theme.softHover}`}
          >
            🛒
          </Link>

          {/* DARK MODE */}
          <button
            onClick={() => setDarkMode((value) => !value)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-colors ${
              darkMode ? "bg-slate-900" : "bg-slate-100"
            } ${theme.softHover}`}
            aria-label="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* ACCOUNT */}
          {userEmail ? (
            <Link
              href="/account"
              className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:block"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:block"
            >
              Login
            </Link>
          )}
        </div>

        {/* MOBILE SEARCH */}
        <div className="border-t px-4 py-3 md:hidden">
          <div
            className={`flex h-11 items-center rounded-xl border px-4 ${theme.input}`}
          >
            <span className="mr-3 text-lg">⌕</span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari coin atau token..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </header>

      {/* MARKET */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            ChainMarket
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Crypto Market
          </h1>

          <p className={`mt-2 max-w-2xl text-sm ${theme.muted}`}>
            Pantau harga dan market data cryptocurrency secara real-time.
            Data market diperbarui otomatis.
          </p>
        </div>

        {/* MARKET STATS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className={`rounded-2xl border p-5 ${theme.card}`}>
            <p className={`text-xs font-semibold uppercase ${theme.muted}`}>
              Coins
            </p>
            <p className="mt-2 text-2xl font-black">
              {coins.length}
            </p>
          </div>

          <div className={`rounded-2xl border p-5 ${theme.card}`}>
            <p className={`text-xs font-semibold uppercase ${theme.muted}`}>
              Data Source
            </p>
            <p className="mt-2 text-2xl font-black">
              CoinMarketCap
            </p>
          </div>

          <div className={`rounded-2xl border p-5 ${theme.card}`}>
            <p className={`text-xs font-semibold uppercase ${theme.muted}`}>
              Update
            </p>
            <p className="mt-2 text-2xl font-black">
              30 sec
            </p>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div className="mb-6 md:hidden">
          <div
            className={`flex h-11 items-center rounded-xl border px-4 ${theme.input}`}
          >
            <span className="mr-3 text-lg">⌕</span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari coin atau token..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* MARKET TABLE */}
        <div className={`overflow-hidden rounded-3xl border ${theme.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead
                className={
                  darkMode
                    ? "border-b border-slate-800 bg-slate-900"
                    : "border-b border-slate-200 bg-slate-50"
                }
              >
                <tr className="text-left text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4 text-right">Price</th>
                  <th className="px-5 py-4 text-right">1H</th>
                  <th className="px-5 py-4 text-right">24H</th>
                  <th className="px-5 py-4 text-right">7D</th>
                  <th className="px-5 py-4 text-right">Market Cap</th>
                  <th className="px-5 py-4 text-right">Volume 24H</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`px-5 py-12 text-center ${theme.muted}`}
                    >
                      Loading market data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : filteredCoins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`px-5 py-12 text-center ${theme.muted}`}
                    >
                      Coin tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredCoins.map((coin) => (
                    <tr
                      key={coin.id}
                      className={`border-b last:border-0 ${
                        darkMode
                          ? "border-slate-800"
                          : "border-slate-100"
                      } ${theme.rowHover}`}
                    >
                      <td className="px-5 py-5 text-sm font-semibold">
                        {coin.rank}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black ${
                              darkMode
                                ? "bg-slate-800"
                                : "bg-slate-100"
                            }`}
                          >
                            {coin.symbol.slice(0, 3)}
                          </div>

                          <div>
                            <p className="font-bold">
                              {coin.name}
                            </p>
                            <p
                              className={`text-xs font-semibold ${theme.muted}`}
                            >
                              {coin.symbol}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-right font-bold">
                        {formatPrice(coin.price)}
                      </td>

                      <td
                        className={`px-5 py-5 text-right text-sm font-semibold ${changeClass(
                          coin.change1h
                        )}`}
                      >
                        {coin.change1h >= 0 ? "+" : ""}
                        {coin.change1h.toFixed(2)}%
                      </td>

                      <td
                        className={`px-5 py-5 text-right text-sm font-semibold ${changeClass(
                          coin.change24h
                        )}`}
                      >
                        {coin.change24h >= 0 ? "+" : ""}
                        {coin.change24h.toFixed(2)}%
                      </td>

                      <td
                        className={`px-5 py-5 text-right text-sm font-semibold ${changeClass(
                          coin.change7d
                        )}`}
                      >
                        {coin.change7d >= 0 ? "+" : ""}
                        {coin.change7d.toFixed(2)}%
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-semibold">
                        {formatCompact(coin.marketCap)}
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-semibold">
                        {formatCompact(coin.volume24h)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className={`mt-4 text-xs ${theme.muted}`}>
          Market data provided by CoinMarketCap. Data is refreshed
          automatically every 30 seconds.
        </p>
      </section>
    </main>
  );
}

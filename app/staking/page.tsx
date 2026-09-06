"use client";

import { useEffect, useState } from "react";
import ChainMarketHeader from "@/components/ChainMarketHeader";
import { useAuth } from "@/components/AuthProvider";

export default function StakingPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  // Load theme yang sudah dipilih dari Marketplace / Blockchain
  useEffect(() => {
    const savedTheme = localStorage.getItem("chain-market-theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
    } else if (savedTheme === "light") {
      setDarkMode(false);
    } else {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      setDarkMode(systemDark);
    }

    setMounted(true);
  }, []);

  // Simpan theme SETELAH theme selesai di-load
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem(
      "chain-market-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode, mounted]);

  const pools = [
    {
      name: "BNB Staking",
      symbol: "BNB",
      reward: "Coming Soon",
    },
    {
      name: "SOL Staking",
      symbol: "SOL",
      reward: "Coming Soon",
    },
    {
      name: "USDC Yield",
      symbol: "USDC",
      reward: "Coming Soon",
    },
  ];

  const filteredPools = pools.filter((pool) => {
    if (!search.trim()) return true;

    const query = search.toLowerCase();

    return (
      pool.name.toLowerCase().includes(query) ||
      pool.symbol.toLowerCase().includes(query)
    );
  });

  const theme = {
    page: darkMode
      ? "bg-slate-950 text-white"
      : "bg-slate-50 text-slate-900",

    header: darkMode
      ? "border-slate-800 bg-slate-950/95"
      : "border-slate-200 bg-white/95",

    input: darkMode
      ? "border-slate-700 bg-slate-900"
      : "border-slate-200 bg-slate-50",

    card: darkMode
      ? "border-slate-800 bg-slate-900"
      : "border-slate-200 bg-white",

    muted: darkMode
      ? "text-slate-400"
      : "text-slate-600",

    soft: darkMode
      ? "bg-slate-900"
      : "bg-slate-100",

    softHover: darkMode
      ? "hover:bg-slate-800"
      : "hover:bg-slate-100",

    topbar: darkMode
      ? "border-slate-800 bg-slate-950"
      : "border-slate-200 bg-white",
  };

  return (
    <main className={`min-h-screen ${theme.page}`}>
      <ChainMarketHeader
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staking pools, assets..."
        mobileSearchPlaceholder="Search staking pools, assets..."
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
        userEmail={user?.email ?? null}
        showCart={false}
      />

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
            STAKING
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            Stake Your Crypto
          </h1>

          <p className={`mt-5 text-lg ${theme.muted}`}>
            Gunakan crypto yang kamu punya untuk mendapatkan
            reward melalui staking langsung dari ChainMarket.
          </p>
        </div>

        {/* STAKING POOLS */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {filteredPools.map((pool) => (
            <div
              key={pool.symbol}
              className={`rounded-3xl border p-6 ${theme.card}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-xl font-black text-purple-700">
                  ◈
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${theme.soft} ${theme.muted}`}
                >
                  {pool.reward}
                </span>
              </div>

              <h2 className="mt-6 text-xl font-bold">
                {pool.name}
              </h2>

              <p className={`mt-2 text-sm ${theme.muted}`}>
                Stake {pool.symbol} dan kelola posisi staking
                kamu dari satu dashboard.
              </p>

              <button
                disabled
                className="mt-6 w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>

        {/* EMPTY SEARCH */}
        {filteredPools.length === 0 && (
          <div
            className={`mt-8 rounded-3xl border p-10 text-center ${theme.card}`}
          >
            <p className={`text-sm ${theme.muted}`}>
              Staking pool tidak ditemukan.
            </p>
          </div>
        )}

        {/* INFO */}
        <div
          className={`mt-8 rounded-3xl border p-8 ${theme.card}`}
        >
          <h2 className="text-2xl font-black">
            One Crypto Platform
          </h2>

          <p className={`mt-3 max-w-2xl ${theme.muted}`}>
            ChainMarket nantinya menggabungkan marketplace,
            crypto marketplace, dan staking dalam satu platform.
          </p>
        </div>
      </section>
    </main>
  );
}
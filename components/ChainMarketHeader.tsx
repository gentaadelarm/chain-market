"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Feature = "ecommerce" | "blockchain" | "staking";

type Props = {
  active: Feature;
  search: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  cartCount?: number;
  onCartClick?: () => void;
};

export default function ChainMarketHeader({
  active,
  search,
  onSearchChange,
  searchPlaceholder = "Search products, categories, sellers...",
  cartCount = 0,
  onCartClick,
}: Props) {
  const [darkMode, setDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

    const email = localStorage.getItem("chain-market-user-email");

    if (email) {
      setUserEmail(email);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "chain-market-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const theme = darkMode
    ? {
        header: "border-slate-800 bg-slate-950/95 text-white",
        input: "border-slate-700 bg-slate-900",
        muted: "text-slate-400",
        soft: "bg-slate-900",
        softHover: "hover:bg-slate-800",
      }
    : {
        header: "border-slate-200 bg-white/95 text-slate-900",
        input: "border-slate-200 bg-slate-50",
        muted: "text-slate-500",
        soft: "bg-slate-100",
        softHover: "hover:bg-slate-100",
      };

  const navClass = (feature: Feature) =>
    `rounded-xl px-3 py-2 text-sm font-semibold ${
      active === feature
        ? "bg-blue-600 text-white"
        : theme.softHover
    }`;

  return (
    <>
      {/* TOP BAR */}
      <div
        className={`hidden border-b md:block ${
          darkMode
            ? "border-slate-800 bg-slate-950 text-slate-300"
            : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600">
              Seller Center
            </span>

            <span>Mulai berjualan di ChainMarket</span>
          </div>

          <div className="flex items-center gap-5">
            <span className="cursor-pointer hover:text-blue-600">
              Bantuan
            </span>

            <span className="cursor-pointer hover:text-blue-600">
              Bahasa
            </span>

            {userEmail ? (
              <Link
                href="/account"
                className="max-w-[220px] truncate font-semibold hover:text-blue-600"
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
      </div>

      {/* MAIN HEADER */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${theme.header}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight sm:text-2xl"
          >
            Chain<span className="text-blue-600">Market</span>
          </Link>

          {/* SEARCH */}
          <div className="hidden min-w-0 flex-1 md:block">
            <div
              className={`mx-auto flex max-w-2xl items-center rounded-xl border px-4 ${theme.input}`}
            >
              <span className={`mr-3 text-lg ${theme.muted}`}>
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) =>
                  onSearchChange?.(event.target.value)
                }
                className="w-full bg-transparent py-2.5 text-sm outline-none"
                placeholder={searchPlaceholder}
              />
            </div>
          </div>

          {/* NAV */}
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className={navClass("ecommerce")}
            >
              Ecommerce
            </Link>

            <Link
              href="/blockchain"
              className={navClass("blockchain")}
            >
              Blockchain
            </Link>

            <Link
              href="/staking"
              className={navClass("staking")}
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

          {/* ACCOUNT */}
          {userEmail ? (
            <Link
              href="/account"
              className={`hidden rounded-xl px-3 py-2 text-sm font-semibold sm:block ${theme.soft}`}
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-blue-600 sm:block"
            >
              Login
            </Link>
          )}

          {/* CART */}
          <button
            onClick={onCartClick}
            className={`relative rounded-xl p-2 text-xl transition-colors ${theme.softHover}`}
            aria-label="Open cart"
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* DARK MODE */}
          <button
            onClick={() => setDarkMode((value) => !value)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors ${theme.soft}`}
            aria-label="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* MOBILE SEARCH */}
        <div
          className={`border-t px-4 py-2 md:hidden ${
            darkMode
              ? "border-slate-800"
              : "border-slate-200"
          }`}
        >
          <div
            className={`flex items-center rounded-xl border px-4 ${theme.input}`}
          >
            <span className={`mr-3 ${theme.muted}`}>
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                onSearchChange?.(event.target.value)
              }
              className="w-full bg-transparent py-2 text-sm outline-none"
              placeholder={searchPlaceholder}
            />
          </div>
        </div>
      </header>
    </>
  );
}

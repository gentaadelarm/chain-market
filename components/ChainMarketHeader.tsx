"use client";

import Link from "next/link";

type ChainMarketHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  mobileSearchPlaceholder?: string;
  darkMode: boolean;
  onToggleTheme: () => void;
  userEmail: string | null;
  showCart?: boolean;
  cartCount?: number;
  onCartClick?: () => void;
  onLogoClick?: () => void;
};

export default function ChainMarketHeader({
  search,
  onSearchChange,
  searchPlaceholder = "Search products, categories, sellers...",
  mobileSearchPlaceholder = "Search products...",
  darkMode,
  onToggleTheme,
  userEmail,
  showCart = true,
  cartCount = 0,
  onCartClick,
  onLogoClick,
}: ChainMarketHeaderProps) {
  const theme = darkMode
    ? {
        header: "bg-[#09090b]/95 border-zinc-800",
        topbar: "bg-zinc-950 border-zinc-800",
        input:
          "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500",
        muted: "text-zinc-400",
        soft: "bg-zinc-900",
        softHover: "hover:bg-zinc-800",
      }
    : {
        header: "bg-white/95 border-zinc-200",
        topbar: "bg-white border-zinc-200",
        input:
          "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400",
        muted: "text-zinc-500",
        soft: "bg-zinc-100",
        softHover: "hover:bg-zinc-200",
      };

  return (
    <>
      {/* TOP BAR */}
      <div className={`border-b text-xs ${theme.topbar}`}>
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <button className="font-medium hover:text-blue-600">
              Seller Center
            </button>

            <button
              className={`hidden sm:block ${theme.muted} hover:text-blue-600`}
            >
              Mulai Berjualan
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className={`${theme.muted} hover:text-blue-600`}>
              Bantuan
            </button>

            <button className={`${theme.muted} hover:text-blue-600`}>
              Bahasa
            </button>

            <span className={theme.muted}>|</span>

            {userEmail ? (
              <Link
                href="/account"
                className="font-semibold hover:text-blue-600"
              >
                {userEmail}
              </Link>
            ) : (
              <Link
                href="/login"
                className="font-semibold hover:text-blue-600"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${theme.header}`}
      >
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center gap-4 px-6">
          {/* LOGO */}
          {onLogoClick ? (
            <button
              onClick={onLogoClick}
              className="shrink-0 text-2xl font-black tracking-tight"
            >
              Chain<span className="text-blue-600">Market</span>
            </button>
          ) : (
            <Link
              href="/"
              className="shrink-0 text-2xl font-black tracking-tight"
            >
              Chain<span className="text-blue-600">Market</span>
            </Link>
          )}

          {/* SEARCH */}
          <div className="hidden flex-1 md:block">
            <div
              className={`mx-auto flex max-w-2xl items-center rounded-xl border px-4 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 ${theme.input}`}
            >
              <span className={`mr-3 text-lg ${theme.muted}`}>⌕</span>

              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder={searchPlaceholder}
              />

              {search && (
                <button
                  onClick={() => onSearchChange("")}
                  className={theme.muted}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* MAIN NAVIGATION */}
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme.softHover}`}
            >
              Ecommerce
            </Link>

            <Link
              href="/blockchain"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme.softHover}`}
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
          {showCart && (
            <button
              onClick={onCartClick}
              className={`relative rounded-xl p-2.5 text-xl transition-colors ${theme.softHover}`}
              aria-label="Open cart"
            >
              🛒

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* DARK MODE */}
          <button
            onClick={onToggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors ${theme.soft} ${theme.softHover}`}
            aria-label="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* ACCOUNT / LOGIN */}
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
        <div className="border-t px-6 py-3 md:hidden">
          <div
            className={`flex items-center rounded-xl border px-4 ${theme.input}`}
          >
            <span className={`mr-3 ${theme.muted}`}>⌕</span>

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full bg-transparent py-2 text-sm outline-none"
              placeholder={mobileSearchPlaceholder}
            />

            {search && (
              <button
                onClick={() => onSearchChange("")}
                className={theme.muted}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

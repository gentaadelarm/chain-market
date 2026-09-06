"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

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
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const currentEmail = user?.email ?? userEmail;

  const userId =
    (user?.user_metadata?.user_code as string | undefined) ??
    user?.id?.slice(0, 12) ??
    "--------";

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;

  const initials =
    currentEmail?.charAt(0).toUpperCase() ?? "U";

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccountOpen(false);
    window.location.href = "/login";
  };

  const theme = darkMode
    ? {
        header: "bg-[#09090b]/95 border-zinc-800",
        topbar: "bg-zinc-950 border-zinc-800",
        input:
          "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500",
        muted: "text-zinc-400",
        soft: "bg-zinc-900",
        softHover: "hover:bg-zinc-800",
        dropdown: "bg-[#18191d] border-zinc-700 text-white",
        dropdownHover: "hover:bg-zinc-800",
        divider: "border-zinc-700",
      }
    : {
        header: "bg-white/95 border-zinc-200",
        topbar: "bg-white border-zinc-200",
        input:
          "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400",
        muted: "text-zinc-500",
        soft: "bg-zinc-100",
        softHover: "hover:bg-zinc-200",
        dropdown: "bg-white border-zinc-200 text-zinc-900",
        dropdownHover: "hover:bg-zinc-100",
        divider: "border-zinc-200",
      };

  return (
    <>
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

          {/* CART SLOT */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
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
          </div>

          {/* THEME */}
          <button
            onClick={onToggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors ${theme.soft} ${theme.softHover}`}
            aria-label="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* PROFILE */}
          {currentEmail ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-blue-500/40 bg-blue-600 text-sm font-bold text-white transition hover:border-blue-500"
                aria-label="Open account menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>

              {accountOpen && (
                <div
                  className={`absolute right-0 top-12 z-[100] w-[300px] overflow-hidden rounded-2xl border shadow-2xl ${theme.dropdown}`}
                >
                  {/* ACCOUNT INFO */}
                  <div className={`px-4 py-4 ${theme.divider} border-b`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold">
                          {currentEmail}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            UID:{userId}
                          </span>

                          <button
                            onClick={() =>
                              navigator.clipboard?.writeText(userId)
                            }
                            className="text-xs text-zinc-500 hover:text-blue-500"
                            aria-label="Copy UID"
                          >
                            ⧉
                          </button>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-lg border border-zinc-600 px-2 py-1 text-center">
                        <div className="text-[9px] text-zinc-400">
                          MEMBER
                        </div>
                        <div className="text-[10px] font-bold">
                          Standard
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MENU */}
                  <div className="p-2">
                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">◉</span>
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/account/settings"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">🛡</span>
                      <span>Security</span>
                    </Link>

                    <Link
                      href="/account/settings"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">🪪</span>
                      <span>Identification / KYC</span>
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">🎉</span>
                      <span>Event Center</span>
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">🏆</span>
                      <span>Rewards Hub</span>
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">🎟</span>
                      <span>My Rewards</span>
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">👥</span>
                      <span>Referral</span>
                    </Link>

                    <Link
                      href="/account/settings/wallets"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">💰</span>
                      <span>Wallet & Withdrawal</span>
                    </Link>

                    <Link
                      href="/account/settings"
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.dropdownHover}`}
                    >
                      <span className="w-5 text-center">⚙️</span>
                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* LOGOUT */}
                  <div className={`border-t p-2 ${theme.divider}`}>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                    >
                      <span className="w-5 text-center">◯</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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

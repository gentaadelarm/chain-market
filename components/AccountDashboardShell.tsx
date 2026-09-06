"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  darkMode: boolean;
  avatarUrl?: string | null;
  initials: string;
  email?: string | null;
  walletAddress?: string | null;
};

export default function AccountDashboardShell({
  children,
  darkMode,
  avatarUrl,
  initials,
  email,
  walletAddress,
}: Props) {
  const menu = [
    { href: "/", icon: "⌂", label: "Home" },
    { href: "/#products", icon: "♧", label: "Products" },
    { href: "/staking", icon: "▱", label: "Staking" },
    { href: "/blockchain", icon: "◇", label: "Blockchain" },
    { href: "/account", icon: "♙", label: "Account", active: true },
  ];

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-[#080d14] text-white"
          : "bg-[#f4f7fb] text-zinc-900"
      }`}
    >
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside
          className={`hidden w-[160px] shrink-0 flex-col border-r md:flex ${
            darkMode
              ? "border-[#17212e] bg-[#0b1119]"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="flex h-[44px] items-center border-b border-inherit px-3">
            <Link href="/" className="flex items-center gap-1.5">
              <div className="relative h-[19px] w-[22px]">
                <span className="absolute left-0 top-[3px] h-[9px] w-[15px] rotate-[28deg] rounded-full border-[2px] border-blue-500" />
                <span className="absolute bottom-[2px] right-0 h-[9px] w-[15px] rotate-[28deg] rounded-full border-[2px] border-blue-400" />
              </div>

              <span className="text-[11px] font-black tracking-tight">
                Chain<span className="text-blue-500">Market</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-2 py-3">
            <p className="mb-2 px-2 text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Menu
            </p>

            <div className="space-y-1">
              {menu.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex h-[28px] items-center gap-2 rounded-md px-2 text-[9px] font-medium transition ${
                    item.active
                      ? "bg-blue-500/15 font-semibold text-blue-500"
                      : darkMode
                        ? "text-zinc-400 hover:bg-[#121b27] hover:text-white"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <span className="w-3 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div
            className={`border-t p-2 ${
              darkMode ? "border-[#17212e]" : "border-zinc-200"
            }`}
          >
            <Link
              href="/account"
              className={`flex items-center gap-2 rounded-md p-1.5 ${
                darkMode ? "hover:bg-[#121b27]" : "hover:bg-zinc-50"
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-300 text-[8px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-bold">Project</p>
                <p className="truncate text-[7px] text-zinc-500">
                  {email ?? "user@chainmarket.app"}
                </p>
              </div>

              <span className="text-[10px] text-zinc-500">›</span>
            </Link>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          <header
            className={`flex h-[44px] items-center justify-end border-b px-3 ${
              darkMode
                ? "border-[#17212e] bg-[#0a1018]"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-[12px] text-zinc-500 hover:text-zinc-300"
                aria-label="Notifications"
              >
                ♧
              </button>

              <button
                type="button"
                className="text-[11px] text-zinc-500 hover:text-blue-500"
                aria-label="Theme"
              >
                {darkMode ? "☼" : "☾"}
              </button>

              <div
                className={`flex h-[25px] items-center gap-1.5 rounded-full border px-2.5 ${
                  darkMode
                    ? "border-[#253447] bg-[#101923]"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />

                <span className="max-w-[75px] truncate text-[8px] font-semibold text-zinc-400">
                  {walletAddress
                    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                    : "Not Connected"}
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    walletAddress
                      ? "bg-emerald-500"
                      : "bg-zinc-500"
                  }`}
                />
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}

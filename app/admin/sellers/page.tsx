"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import ChainMarketHeader from "@/components/ChainMarketHeader";

type Seller = {
  seller_id: string;
  seller_status: "pending" | "approved" | "rejected" | "suspended";
  verification_status?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function AdminSellersPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [rejectingSeller, setRejectingSeller] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isAdmin = user?.app_metadata?.role === "admin";

  async function loadSellers() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setSellers([]);
    } else {
      setSellers((data ?? []) as Seller[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadSellers();
  }, [authLoading, user, isAdmin]);

  async function approveSeller(sellerId: string) {
    setMessage("");

    const { error } = await supabase
      .from("seller_profiles")
      .update({
        seller_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("seller_id", sellerId);

    if (error) {
      setMessage(`Gagal approve: ${error.message}`);
      return;
    }

    setMessage("✅ Seller berhasil di-approve.");
    await loadSellers();
  }

  async function rejectSeller(sellerId: string) {
    if (!rejectReason.trim()) {
      setMessage("❌ Isi alasan reject terlebih dahulu.");
      return;
    }

    setMessage("");

    const { error } = await supabase
      .from("seller_profiles")
      .update({
        seller_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("seller_id", sellerId);

    if (error) {
      setMessage(`Gagal reject: ${error.message}`);
      return;
    }

    setRejectingSeller(null);
    setRejectReason("");
    setMessage("❌ Seller berhasil di-reject.");
    await loadSellers();
  }

  if (authLoading || loading) {
    return (
      <main
        className={`min-h-screen ${
          darkMode ? "bg-[#09090b] text-white" : "bg-zinc-50 text-zinc-900"
        }`}
      >
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        className={`min-h-screen ${
          darkMode ? "bg-[#09090b] text-white" : "bg-zinc-50 text-zinc-900"
        }`}
      >
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">Login diperlukan</h1>
          <p className="mt-2 text-sm opacity-70">
            Login sebagai admin untuk membuka halaman ini.
          </p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main
        className={`min-h-screen ${
          darkMode ? "bg-[#09090b] text-white" : "bg-zinc-50 text-zinc-900"
        }`}
      >
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-sm opacity-70">
            Halaman ini hanya bisa diakses oleh administrator.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen ${
        darkMode ? "bg-[#09090b] text-white" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      <ChainMarketHeader
        search=""
        onSearchChange={() => {}}
        searchPlaceholder="Search..."
        mobileSearchPlaceholder="Search..."
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        userEmail={user.email ?? null}
        showCart={false}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium opacity-60">ADMIN PANEL</p>
          <h1 className="mt-1 text-3xl font-bold">Seller Applications</h1>
          <p className="mt-2 text-sm opacity-60">
            Review dan kelola pendaftaran seller ChainMarket.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {message}
          </div>
        )}

        {sellers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl">📭</div>
            <p className="mt-3 font-medium">Belum ada seller application.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="px-3 py-4 font-semibold">Seller</th>
                  <th className="px-3 py-4 font-semibold">Status</th>
                  <th className="px-3 py-4 font-semibold">Verification</th>
                  <th className="px-3 py-4 font-semibold">Registered</th>
                  <th className="px-3 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {sellers.map((seller) => {
                  const status = seller.seller_status;

                  return (
                    <tr
                      key={seller.seller_id}
                      className="border-b border-zinc-200 dark:border-zinc-800"
                    >
                      <td className="px-3 py-5">
                        <div className="font-medium">Seller Application</div>
                        <div className="mt-1 max-w-[320px] truncate font-mono text-xs opacity-50">
                          {seller.seller_id}
                        </div>
                      </td>

                      <td className="px-3 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            status === "approved"
                              ? "bg-green-100 text-green-700"
                              : status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : status === "suspended"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-3 py-5 text-xs opacity-70">
                        {seller.verification_status ?? "pending"}
                      </td>

                      <td className="px-3 py-5 text-xs opacity-60">
                        {seller.created_at
                          ? new Date(seller.created_at).toLocaleString("id-ID")
                          : "-"}
                      </td>

                      <td className="px-3 py-5">
                        {status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => approveSeller(seller.seller_id)}
                              className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
                            >
                              ✅ Approve
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectingSeller(seller.seller_id);
                                setRejectReason("");
                              }}
                              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-xs opacity-40">
                            No action
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {rejectingSeller && (
              <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <p className="text-sm font-semibold">Reject Seller</p>

                <p className="mt-1 text-xs opacity-60">
                  Masukkan alasan penolakan sebelum melanjutkan.
                </p>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Dokumen verifikasi belum lengkap."
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => rejectSeller(rejectingSeller)}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Confirm Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingSeller(null);
                      setRejectReason("");
                    }}
                    className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </section>
    </main>
  );
}

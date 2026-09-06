"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ShippingAddress = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

const emptyForm = {
  label: "",
  recipient_name: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  country: "Indonesia",
};

export default function ShippingAddressesPage() {
  const supabase = createClient();

  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  async function loadAddresses() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load addresses:", error);
      alert("Failed to load shipping addresses.");
    } else {
      setAddresses(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("chain-market-theme");

    if (savedTheme === "dark") {
      setTheme("dark");
    }

    loadAddresses();
  }, []);

  function updateField(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(address: ShippingAddress) {
    setEditingId(address.id);

    setForm({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      province: address.province,
      postal_code: address.postal_code,
      country: address.country,
    });

    setShowForm(true);
  }

  async function saveAddress() {
    if (
      !form.label ||
      !form.recipient_name ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.province ||
      !form.postal_code
    ) {
      alert("Please complete all required fields.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first.");
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from("shipping_addresses")
          .update({
            label: form.label,
            recipient_name: form.recipient_name,
            phone: form.phone,
            address: form.address,
            city: form.city,
            province: form.province,
            postal_code: form.postal_code,
            country: form.country,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to update address:", error);
          alert("Failed to update address.");
          return;
        }
      } else {
        const isFirstAddress = addresses.length === 0;

        const { error } = await supabase
          .from("shipping_addresses")
          .insert({
            user_id: user.id,
            label: form.label,
            recipient_name: form.recipient_name,
            phone: form.phone,
            address: form.address,
            city: form.city,
            province: form.province,
            postal_code: form.postal_code,
            country: form.country,
            is_default: isFirstAddress,
          });

        if (error) {
          console.error("Failed to create address:", error);
          alert("Failed to create address.");
          return;
        }
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await loadAddresses();
    } finally {
      setSaving(false);
    }
  }

  async function setDefaultAddress(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error: resetError } = await supabase
      .from("shipping_addresses")
      .update({
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (resetError) {
      console.error("Failed to reset default address:", resetError);
      alert("Failed to update default address.");
      return;
    }

    const { error } = await supabase
      .from("shipping_addresses")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to set default address:", error);
      alert("Failed to set default address.");
      return;
    }

    await loadAddresses();
  }

  async function deleteAddress(id: string) {
    const address = addresses.find(
      (item) => item.id === id
    );

    if (!address) {
      return;
    }

    if (
      !confirm(
        `Delete "${address.label}" shipping address?`
      )
    ) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("shipping_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete address:", error);
      alert("Failed to delete address.");
      return;
    }

    await loadAddresses();
  }

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    localStorage.setItem("chain-market-theme", nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <main
      className={`min-h-screen px-4 py-6 transition-colors sm:px-6 sm:py-10 ${
        isDark
          ? "bg-[#08090c] text-white"
          : "bg-[#f5f6fa] text-gray-900"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() =>
                (window.location.href =
                  "/account/settings")
              }
              className={`mb-3 text-sm ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              ← Account Settings
            </button>

            <h1 className="text-3xl font-semibold tracking-tight">
              Shipping Addresses
            </h1>

            <p
              className={`mt-2 text-sm ${
                isDark
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Manage the addresses used for your orders.
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className={`rounded-full border px-4 py-2 text-sm ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-black/10 bg-white"
            }`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        {loading ? (
          <div
            className={`rounded-3xl border p-8 text-center ${
              isDark
                ? "border-white/10 bg-white/[0.03]"
                : "border-black/5 bg-white"
            }`}
          >
            Loading addresses...
          </div>
        ) : (
          <>
            {!showForm && (
              <button
                onClick={openAddForm}
                className={`mb-6 w-full rounded-3xl border p-6 text-left transition ${
                  isDark
                    ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    : "border-black/5 bg-white hover:shadow-md"
                }`}
              >
                <div className="text-lg font-semibold">
                  + Add New Address
                </div>

                <div
                  className={`mt-1 text-sm ${
                    isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Add another delivery address to your
                  account.
                </div>
              </button>
            )}

            {showForm && (
              <div
                className={`mb-6 rounded-3xl border p-6 ${
                  isDark
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-black/5 bg-white"
                }`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {editingId
                        ? "Edit Address"
                        : "Add New Address"}
                    </h2>

                    <p
                      className={`mt-1 text-sm ${
                        isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Enter the complete delivery
                      information.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      isDark
                        ? "bg-white/5 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Address Label
                    </label>
                    <input
                      value={form.label}
                      onChange={(e) =>
                        updateField(
                          "label",
                          e.target.value
                        )
                      }
                      placeholder="Home"
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Recipient Name
                    </label>
                    <input
                      value={form.recipient_name}
                      onChange={(e) =>
                        updateField(
                          "recipient_name",
                          e.target.value
                        )
                      }
                      placeholder="Full name"
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Phone Number
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        updateField(
                          "phone",
                          e.target.value
                        )
                      }
                      placeholder="08xxxxxxxxxx"
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Postal Code
                    </label>
                    <input
                      value={form.postal_code}
                      onChange={(e) =>
                        updateField(
                          "postal_code",
                          e.target.value
                        )
                      }
                      placeholder="701xx"
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Full Address
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) =>
                        updateField(
                          "address",
                          e.target.value
                        )
                      }
                      placeholder="Street, building, house number, neighborhood..."
                      rows={3}
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      City
                    </label>
                    <input
                      value={form.city}
                      onChange={(e) =>
                        updateField(
                          "city",
                          e.target.value
                        )
                      }
                      placeholder="City"
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Province
                    </label>
                    <input
                      value={form.province}
                      onChange={(e) =>
                        updateField(
                          "province",
                          e.target.value
                        )
                      }
                      placeholder="Province"
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Country
                    </label>
                    <input
                      value={form.country}
                      onChange={(e) =>
                        updateField(
                          "country",
                          e.target.value
                        )
                      }
                      className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        isDark
                          ? "border-white/10 bg-black/20"
                          : "border-black/10 bg-gray-50"
                      }`}
                    />
                  </div>
                </div>

                <button
                  onClick={saveAddress}
                  disabled={saving}
                  className={`mt-6 w-full rounded-2xl px-5 py-4 font-semibold transition ${
                    saving
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  } ${
                    isDark
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-black text-white hover:opacity-85"
                  }`}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Save Address"}
                </button>
              </div>
            )}

            {addresses.length === 0 && !showForm ? (
              <div
                className={`rounded-3xl border p-10 text-center ${
                  isDark
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-black/5 bg-white"
                }`}
              >
                <div className="text-4xl">📍</div>

                <h2 className="mt-4 text-xl font-semibold">
                  No shipping addresses yet
                </h2>

                <p
                  className={`mt-2 text-sm ${
                    isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Add your first delivery address.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`rounded-3xl border p-6 ${
                      isDark
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-black/5 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">
                            {address.label}
                          </h2>

                          {address.is_default && (
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                              ⭐ Default
                            </span>
                          )}
                        </div>

                        <div className="mt-4 space-y-1 text-sm">
                          <p className="font-medium">
                            {address.recipient_name}
                          </p>

                          <p
                            className={
                              isDark
                                ? "text-gray-300"
                                : "text-gray-600"
                            }
                          >
                            {address.phone}
                          </p>

                          <p
                            className={`pt-2 leading-relaxed ${
                              isDark
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {address.address}
                            <br />
                            {address.city},{" "}
                            {address.province}{" "}
                            {address.postal_code}
                            <br />
                            {address.country}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!address.is_default && (
                          <button
                            onClick={() =>
                              setDefaultAddress(
                                address.id
                              )
                            }
                            className={`rounded-xl px-4 py-2 text-sm ${
                              isDark
                                ? "bg-white/5 text-gray-300 hover:bg-white/10"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Set Default
                          </button>
                        )}

                        <button
                          onClick={() =>
                            openEditForm(address)
                          }
                          className={`rounded-xl px-4 py-2 text-sm ${
                            isDark
                              ? "bg-white/5 text-gray-300 hover:bg-white/10"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteAddress(address.id)
                          }
                          className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

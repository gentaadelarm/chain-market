"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: number;
  name: string;
  price: number;
  seller: string;
  emoji: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function CheckoutPage() {
  const supabase = createClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [paymentStep, setPaymentStep] = useState(false);
const [reviewStep, setReviewStep] = useState(false);
const [wallets, setWallets] = useState<
  { chain: "bsc" | "base" | "solana"; address: string }[]
>([]);
const [selectedChain, setSelectedChain] = useState<
  "bsc" | "base" | "solana" | null
>(null);
const [selectedToken, setSelectedToken] = useState<
  "USDT" | "USDC" | null
>(null);
const [walletLoading, setWalletLoading] = useState(false);

useEffect(() => {
  async function loadWallets() {
    setWalletLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setWallets([]);
        return;
      }

      const { data, error } = await supabase
        .from("wallets")
        .select("chain,address")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to load wallets:", error);
        setWallets([]);
        return;
      }

      setWallets(
        (data ?? []) as {
          chain: "bsc" | "base" | "solana";
          address: string;
        }[]
      );
    } finally {
      setWalletLoading(false);
    }
  }

  loadWallets();
}, []);
  useEffect(() => {
    const savedCart =
      localStorage.getItem("chain-market-cart");

    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      } catch {
        setCart([]);
      }
    }

    const savedTheme =
      localStorage.getItem("chain-market-theme");

    if (savedTheme === "dark") {
      setTheme("dark");
    } else {
      setTheme("light");
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      "chain-market-cart",
      JSON.stringify(cart)
    );

    window.dispatchEvent(
      new Event("chain-market-cart-updated")
    );
  }, [cart, loaded]);

  function updateQuantity(
    productId: number,
    amount: number
  ) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: item.quantity + amount,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeProduct(productId: number) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.product.id !== productId
      )
    );
  }

  function toggleTheme() {
    const nextTheme =
      theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    localStorage.setItem(
      "chain-market-theme",
      nextTheme
    );

    window.dispatchEvent(
      new Event("chain-market-theme-updated")
    );
  }

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      item.product.price * item.quantity,
    0
  );

  const totalItems = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const isDark = theme === "dark";
  const availableChains = {
  bsc: wallets.find((wallet) => wallet.chain === "bsc"),
  base: wallets.find((wallet) => wallet.chain === "base"),
  solana: wallets.find((wallet) => wallet.chain === "solana"),
};

const selectedWallet = selectedChain
  ? availableChains[selectedChain]
  : null;

const chainLabel = {
  bsc: "BSC",
  base: "Base",
  solana: "Solana",
};

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-6 py-12 text-gray-900 dark:bg-[#08090c] dark:text-white">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse text-sm text-gray-500">
            Loading checkout...
          </div>
        </div>
      </main>
    );
  }

    if (reviewStep) {
  return (
    <main
      className={`min-h-screen px-4 py-6 sm:px-6 sm:py-10 ${
        isDark
          ? "bg-[#08090c] text-white"
          : "bg-[#f5f6fa] text-gray-900"
      }`}
    >
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => setReviewStep(false)}
            className={`text-sm font-medium ${
              isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            ← Back to Payment
          </button>

          <button
            onClick={toggleTheme}
            className={`rounded-full border px-4 py-2 text-sm ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-gray-200 bg-white"
            }`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </header>

        {/* TITLE */}
        <div className="mt-10">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${
                isDark ? "bg-white/10" : "bg-white shadow-sm"
              }`}
            >
              🔐
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Review Payment
              </h1>

              <p
                className={`mt-1 text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Review your payment before confirming.
              </p>
            </div>
          </div>

          {/* STEPS */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                ✓
              </span>
              <span
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Order
              </span>
            </div>

            <div
              className={`h-px w-10 sm:w-16 ${
                isDark ? "bg-white/10" : "bg-gray-200"
              }`}
            />

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                ✓
              </span>
              <span
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Payment
              </span>
            </div>

            <div
              className={`h-px w-10 sm:w-16 ${
                isDark ? "bg-white/10" : "bg-gray-200"
              }`}
            />

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                3
              </span>
              <span className="text-sm font-semibold">
                Review
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* LEFT */}
          <section className="space-y-6">

            {/* ORDER */}
            <div
              className={`rounded-3xl border p-6 shadow-sm ${
                isDark
                  ? "border-white/10 bg-white/[0.035]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h2 className="text-lg font-semibold">
                Order Summary
              </h2>

              <div
                className={`mt-5 divide-y ${
                  isDark
                    ? "divide-white/10"
                    : "divide-gray-100"
                }`}
              >
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                          isDark
                            ? "bg-white/5"
                            : "bg-gray-50"
                        }`}
                      >
                        {item.product.emoji}
                      </div>

                      <div>
                        <p className="font-medium">
                          {item.product.name}
                        </p>

                        <p
                          className={`text-xs ${
                            isDark
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          {item.quantity} × $
                          {item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold">
                      $
                      {(
                        item.product.price *
                        item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT DETAILS */}
            <div
              className={`rounded-3xl border p-6 shadow-sm ${
                isDark
                  ? "border-white/10 bg-white/[0.035]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h2 className="text-lg font-semibold">
                Payment Details
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex justify-between gap-4">
                  <span
                    className={
                      isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  >
                    Network
                  </span>

                  <span className="font-semibold">
                    {selectedChain
                      ? chainLabel[selectedChain]
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span
                    className={
                      isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  >
                    Token
                  </span>

                  <span className="font-semibold">
                    {selectedToken ?? "—"}
                  </span>
                </div>

                <div
                  className={`border-t pt-4 ${
                    isDark
                      ? "border-white/10"
                      : "border-gray-100"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      isDark
                        ? "text-gray-500"
                        : "text-gray-400"
                    }`}
                  >
                    Paying from
                  </p>

                  <p className="mt-1 break-all font-mono text-sm">
                    {selectedWallet?.address ?? "—"}
                  </p>
                </div>

              </div>
            </div>

            {/* PAYMENT ROUTE */}
            <div
              className={`rounded-3xl border p-6 shadow-sm ${
                isDark
                  ? "border-white/10 bg-white/[0.035]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h2 className="text-lg font-semibold">
                Payment Route
              </h2>

              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <div className="rounded-2xl border px-5 py-4 text-center">
                  <p className="text-sm font-semibold">
                    Buyer Wallet
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isDark
                        ? "text-gray-500"
                        : "text-gray-400"
                    }`}
                  >
                    Your connected wallet
                  </p>
                </div>

                <span className="text-xl">→</span>

                <div className="rounded-2xl border px-5 py-4 text-center">
                  <p className="text-sm font-semibold">
                    Chain Market
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isDark
                        ? "text-gray-500"
                        : "text-gray-400"
                    }`}
                  >
                    Payment Gateway / Escrow
                  </p>
                </div>

                <span className="text-xl">→</span>

                <div className="rounded-2xl border px-5 py-4 text-center">
                  <p className="text-sm font-semibold">
                    Seller
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isDark
                        ? "text-gray-500"
                        : "text-gray-400"
                    }`}
                  >
                    Settlement destination
                  </p>
                </div>
              </div>
            </div>

          </section>

          {/* RIGHT */}
          <aside>
            <div
              className={`sticky top-6 rounded-3xl border shadow-xl ${
                isDark
                  ? "border-white/10 bg-white/[0.045]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="p-6">

                <p
                  className={`text-sm ${
                    isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Total to pay
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {subtotal.toFixed(2)}{" "}
                  {selectedToken ?? ""}
                </p>

                <div
                  className={`my-6 border-t ${
                    isDark
                      ? "border-white/10"
                      : "border-gray-100"
                  }`}
                />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span
                      className={
                        isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      Network
                    </span>

                    <span>
                      {selectedChain
                        ? chainLabel[selectedChain]
                        : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span
                      className={
                        isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      Token
                    </span>

                    <span>
                      {selectedToken ?? "—"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={async () => {
  if (
    !selectedChain ||
    !selectedToken ||
    !selectedWallet ||
    cart.length === 0
  ) {
    return;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login before placing an order.");
      return;
    }

    const marketplaceFee = subtotal * 0.01;
    const totalAmount = subtotal;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending_payment",
        payment_chain: selectedChain,
        payment_token: selectedToken,
        subtotal,
        marketplace_fee: marketplaceFee,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      alert("Failed to create order. Please try again.");
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      seller: item.product.seller,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);

      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      alert("Failed to create order items. Please try again.");
      return;
    }

    alert(
      `Order created successfully!\\n\\nOrder ID: ${order.id}\\nStatus: Pending Payment`
    );
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Something went wrong. Please try again.");
  }
}}
                  className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-semibold shadow-lg transition ${
                    isDark
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-black text-white hover:opacity-85"
                  }`}
                >
                  Confirm & Pay →
                </button>

                <p
                  className={`mt-4 text-center text-[11px] leading-relaxed ${
                    isDark
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  You will confirm the transaction in your
                  wallet. No transaction is sent yet.
                </p>

              </div>
            </div>
          </aside>

        </div>

        <div
          className={`mt-10 pb-6 text-center text-xs ${
            isDark
              ? "text-gray-600"
              : "text-gray-400"
          }`}
        >
          Chain Market · Buy anything. Pay with crypto.
        </div>

      </div>
    </main>
  );
}

    if (paymentStep) {


    return (
      <main
        className={`min-h-screen px-4 py-6 transition-colors sm:px-6 sm:py-10 ${
          isDark
            ? "bg-[#08090c] text-white"
            : "bg-[#f5f6fa] text-gray-900"
        }`}
      >
        {/* BACKGROUND */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className={`absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full blur-3xl ${
              isDark
                ? "bg-indigo-600/10"
                : "bg-indigo-300/20"
            }`}
          />

          <div
            className={`absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full blur-3xl ${
              isDark
                ? "bg-purple-600/10"
                : "bg-purple-300/20"
            }`}
          />
        </div>

        <div className="relative mx-auto max-w-5xl">

          {/* HEADER */}
          <header className="flex items-center justify-between">
            <button
              onClick={() => setPaymentStep(false)}
              className={`text-sm font-medium transition ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              ← Back to Order
            </button>

            <button
              onClick={toggleTheme}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </header>

          {/* TITLE */}
          <div className="mt-10">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${
                  isDark
                    ? "bg-white/10"
                    : "bg-white shadow-sm"
                }`}
              >
                💳
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Payment
                </h1>

                <p
                  className={`mt-1 text-sm ${
                    isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Choose how you want to pay.
                </p>
              </div>
            </div>

            {/* STEPS */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                  ✓
                </span>

                <span
                  className={`text-sm ${
                    isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Order
                </span>
              </div>

              <div
                className={`h-px w-12 sm:w-20 ${
                  isDark
                    ? "bg-white/10"
                    : "bg-gray-200"
                }`}
              />

              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                  2
                </span>

                <span className="text-sm font-semibold">
                  Payment
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT CONTENT */}
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* LEFT */}
            <section className="space-y-6">

              {/* NETWORK */}
              <div
                className={`rounded-3xl border p-6 shadow-sm ${
                  isDark
                    ? "border-white/10 bg-white/[0.035]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Choose Network
                  </h2>

                  <p
                    className={`mt-1 text-sm ${
                      isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Select a network with a connected wallet.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">

                  {/* BSC */}
                  <button
                    disabled={!availableChains.bsc}
                    onClick={() => setSelectedChain("bsc")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      !availableChains.bsc
                        ? isDark
                          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40"
                          : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-40"
                        : selectedChain === "bsc"
                        ? isDark
                          ? "border-white bg-white/10"
                          : "border-black bg-gray-50"
                        : isDark
                        ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-2xl">🟡</div>

                    <p className="mt-3 font-semibold">
                      BSC
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        availableChains.bsc
                          ? isDark
                            ? "text-green-400"
                            : "text-green-600"
                          : isDark
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {availableChains.bsc
                        ? "Wallet connected"
                        : "Not connected"}
                    </p>
                  </button>

                  {/* BASE */}
                  <button
                    disabled={!availableChains.base}
                    onClick={() => setSelectedChain("base")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      !availableChains.base
                        ? isDark
                          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40"
                          : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-40"
                        : selectedChain === "base"
                        ? isDark
                          ? "border-white bg-white/10"
                          : "border-black bg-gray-50"
                        : isDark
                        ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-2xl">🔵</div>

                    <p className="mt-3 font-semibold">
                      Base
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        availableChains.base
                          ? isDark
                            ? "text-green-400"
                            : "text-green-600"
                          : isDark
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {availableChains.base
                        ? "Wallet connected"
                        : "Not connected"}
                    </p>
                  </button>

                  {/* SOLANA */}
                  <button
                    disabled={!availableChains.solana}
                    onClick={() => setSelectedChain("solana")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      !availableChains.solana
                        ? isDark
                          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40"
                          : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-40"
                        : selectedChain === "solana"
                        ? isDark
                          ? "border-white bg-white/10"
                          : "border-black bg-gray-50"
                        : isDark
                        ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-2xl">🟣</div>

                    <p className="mt-3 font-semibold">
                      Solana
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        availableChains.solana
                          ? isDark
                            ? "text-green-400"
                            : "text-green-600"
                          : isDark
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {availableChains.solana
                        ? "Wallet connected"
                        : "Not connected"}
                    </p>
                  </button>

                </div>
              </div>

              {/* TOKEN */}
              <div
                className={`rounded-3xl border p-6 shadow-sm ${
                  isDark
                    ? "border-white/10 bg-white/[0.035]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Choose Token
                  </h2>

                  <p
                    className={`mt-1 text-sm ${
                      isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Select the stablecoin you want to use.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">

                  {/* USDT */}
                  <button
                    onClick={() => setSelectedToken("USDT")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedToken === "USDT"
                        ? isDark
                          ? "border-white bg-white/10"
                          : "border-black bg-gray-50"
                        : isDark
                        ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-xl">
                        ₮
                      </div>

                      <div>
                        <p className="font-semibold">
                          USDT
                        </p>

                        <p
                          className={`text-xs ${
                            isDark
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          Tether USD
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* USDC */}
                  <button
                    onClick={() => setSelectedToken("USDC")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedToken === "USDC"
                        ? isDark
                          ? "border-white bg-white/10"
                          : "border-black bg-gray-50"
                        : isDark
                        ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 text-xl">
                        $
                      </div>

                      <div>
                        <p className="font-semibold">
                          USDC
                        </p>

                        <p
                          className={`text-xs ${
                            isDark
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          USD Coin
                        </p>
                      </div>
                    </div>
                  </button>

                </div>
              </div>

              {/* WALLET */}
              <div
                className={`rounded-3xl border p-6 shadow-sm ${
                  isDark
                    ? "border-white/10 bg-white/[0.035]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Pay from
                  </h2>

                  <p
                    className={`mt-1 text-sm ${
                      isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Your connected wallet for this network.
                  </p>
                </div>

                {selectedWallet ? (
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark
                        ? "border-white/10 bg-white/[0.025]"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                        ✓
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          {selectedChain
                            ? chainLabel[selectedChain]
                            : ""}
                        </p>

                        <p className="truncate font-mono text-sm">
                          {selectedWallet.address}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl border p-4 text-sm ${
                      isDark
                        ? "border-white/10 bg-white/[0.02] text-gray-500"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    Select a network to see your wallet.
                  </div>
                )}
              </div>

            </section>

            {/* RIGHT SUMMARY */}
            <aside>
              <div
                className={`sticky top-6 rounded-3xl border shadow-xl ${
                  isDark
                    ? "border-white/10 bg-white/[0.045]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="p-6">

                  <p
                    className={`text-sm ${
                      isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Payment total
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    ${subtotal.toFixed(2)}
                  </p>

                  <div
                    className={`my-6 border-t ${
                      isDark
                        ? "border-white/10"
                        : "border-gray-100"
                    }`}
                  />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span
                        className={
                          isDark
                            ? "text-gray-400"
                            : "text-gray-500"
                        }
                      >
                        Network
                      </span>

                      <span>
                        {selectedChain
                          ? chainLabel[selectedChain]
                          : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span
                        className={
                          isDark
                            ? "text-gray-400"
                            : "text-gray-500"
                        }
                      >
                        Token
                      </span>

                      <span>
                        {selectedToken ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`mt-6 rounded-2xl border p-4 ${
                      isDark
                        ? "border-white/10 bg-white/[0.025]"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <p
                      className={`text-xs ${
                        isDark
                          ? "text-gray-500"
                          : "text-gray-400"
                      }`}
                    >
                      Amount to pay
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {selectedToken
                        ? `${subtotal.toFixed(2)} ${selectedToken}`
                        : "$" + subtotal.toFixed(2)}
                    </p>
                  </div>

                  <button
                    disabled={!selectedChain || !selectedToken}
                   onClick={() => {
  if (!selectedChain || !selectedToken || !selectedWallet) {
    return;
  }

  setReviewStep(true);
}}
                    className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-semibold shadow-lg transition ${
                      !selectedChain || !selectedToken
                        ? isDark
                          ? "cursor-not-allowed bg-white/10 text-gray-600"
                          : "cursor-not-allowed bg-gray-100 text-gray-400"
                        : isDark
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-black text-white hover:opacity-85"
                    }`}
                  >
                    Review Payment →
                  </button>

                  <p
                    className={`mt-4 text-center text-[11px] leading-relaxed ${
                      isDark
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    No blockchain transaction will be sent
                    yet. You will review the payment before
                    confirmation.
                  </p>

                </div>
              </div>
            </aside>

          </div>

          {/* FOOTER */}
          <div
            className={`mt-10 pb-6 text-center text-xs ${
              isDark
                ? "text-gray-600"
                : "text-gray-400"
            }`}
          >
            Chain Market · Buy anything. Pay with crypto.
          </div>

        </div>
      </main>
    );
  }
  if (cart.length === 0) {
    return (
      <main
        className={`min-h-screen px-6 py-12 transition-colors ${
          isDark
            ? "bg-[#08090c] text-white"
            : "bg-[#f6f7fb] text-gray-900"
        }`}
      >
        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className={`absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl ${
              isDark
                ? "bg-indigo-600/10"
                : "bg-indigo-300/30"
            }`}
          />

          <div
            className={`absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl ${
              isDark
                ? "bg-purple-600/10"
                : "bg-purple-300/20"
            }`}
          />
        </div>

        <div className="relative mx-auto max-w-5xl">

          {/* HEADER */}
          <header className="flex items-center justify-between">
            <a
              href="/"
              className={`text-sm transition ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              ← Back to Shop
            </a>

            <button
              onClick={toggleTheme}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </header>

          <div className="mt-20 text-center">

            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-xl ${
                isDark
                  ? "border border-white/10 bg-white/5"
                  : "border border-gray-200 bg-white"
              }`}
            >
              🛒
            </div>

            <h1 className="mt-8 text-4xl font-bold tracking-tight">
              Your cart is empty
            </h1>

            <p
              className={`mx-auto mt-4 max-w-md ${
                isDark
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Looks like you haven't added
              anything to your cart yet.
            </p>

            <a
              href="/"
              className="mt-8 inline-flex rounded-2xl bg-black px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-80 dark:bg-white dark:text-black"
            >
              Continue Shopping
            </a>

          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen px-4 py-6 transition-colors sm:px-6 sm:py-10 ${
        isDark
          ? "bg-[#08090c] text-white"
          : "bg-[#f5f6fa] text-gray-900"
      }`}
    >

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div
          className={`absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full blur-3xl ${
            isDark
              ? "bg-indigo-600/10"
              : "bg-indigo-300/20"
          }`}
        />

        <div
          className={`absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full blur-3xl ${
            isDark
              ? "bg-purple-600/10"
              : "bg-purple-300/20"
          }`}
        />

        <div
          className={`absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-3xl ${
            isDark
              ? "bg-blue-600/5"
              : "bg-blue-300/10"
          }`}
        />

      </div>

      <div className="relative mx-auto max-w-6xl">

        {/* HEADER */}
        <header className="flex items-center justify-between">

          <a
            href="/"
            className={`text-sm font-medium transition ${
              isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            ← Back to Shop
          </a>

          <div className="flex items-center gap-3">

            <div
              className={`hidden rounded-full px-3 py-1.5 text-xs font-medium sm:block ${
                isDark
                  ? "border border-white/10 bg-white/5 text-gray-300"
                  : "border border-gray-200 bg-white text-gray-600"
              }`}
            >
              🔒 Secure Checkout
            </div>

            <button
              onClick={toggleTheme}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

          </div>
        </header>

        {/* TITLE */}
        <div className="mt-10">

          <div className="flex items-center gap-3">

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${
                isDark
                  ? "bg-white/10"
                  : "bg-white shadow-sm"
              }`}
            >
              🛍️
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Checkout
              </h1>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                Review your order before payment.
              </p>
            </div>

          </div>

          {/* STEP INDICATOR */}
          <div className="mt-8 flex items-center gap-3">

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                1
              </span>

              <span className="text-sm font-medium">
                Order
              </span>
            </div>

            <div
              className={`h-px w-12 sm:w-20 ${
                isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
              }`}
            />

            <div
              className={`flex items-center gap-2 ${
                isDark
                  ? "text-gray-500"
                  : "text-gray-400"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                  isDark
                    ? "border-white/10"
                    : "border-gray-200"
                }`}
              >
                2
              </span>

              <span className="text-sm">
                Payment
              </span>
            </div>

          </div>

        </div>

        {/* CONTENT */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ORDER */}
          <section>

            <div
              className={`overflow-hidden rounded-3xl border shadow-sm backdrop-blur-xl ${
                isDark
                  ? "border-white/10 bg-white/[0.035]"
                  : "border-gray-200 bg-white"
              }`}
            >

              {/* CARD HEADER */}
              <div
                className={`flex items-center justify-between border-b px-6 py-5 ${
                  isDark
                    ? "border-white/10"
                    : "border-gray-100"
                }`}
              >

                <div>
                  <h2 className="font-semibold">
                    Order Summary
                  </h2>

                  <p
                    className={`mt-1 text-sm ${
                      isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {totalItems} item
                    {totalItems !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>

                <div
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    isDark
                      ? "bg-white/5 text-gray-300"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cart.length} product
                  {cart.length !== 1
                    ? "s"
                    : ""}
                </div>

              </div>

              {/* PRODUCTS */}
              <div
                className={`divide-y ${
                  isDark
                    ? "divide-white/10"
                    : "divide-gray-100"
                }`}
              >

                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-6"
                  >

                    <div className="flex gap-4">

                      {/* PRODUCT ICON */}
                      <div
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-4xl ${
                          isDark
                            ? "bg-white/5"
                            : "bg-gray-50"
                        }`}
                      >
                        {item.product.emoji}
                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">

                        <div className="flex justify-between gap-4">

                          <div>

                            <h3 className="font-semibold">
                              {item.product.name}
                            </h3>

                            <p
                              className={`mt-1 text-sm ${
                                isDark
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {item.product.seller}
                            </p>

                          </div>

                          <p className="shrink-0 font-semibold">
                            $
                            {(
                              item.product.price *
                              item.quantity
                            ).toFixed(2)}
                          </p>

                        </div>

                        <div className="mt-4 flex items-center justify-between">

                          {/* QUANTITY */}
                          <div className="flex items-center gap-3">

                            <span
                              className={`text-xs ${
                                isDark
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              Quantity
                            </span>

                            <div
                              className={`flex items-center overflow-hidden rounded-xl border ${
                                isDark
                                  ? "border-white/10 bg-white/5"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >

                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    -1
                                  )
                                }
                                className={`flex h-9 w-9 items-center justify-center text-lg transition ${
                                  isDark
                                    ? "hover:bg-white/10"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                −
                              </button>

                              <span
                                className={`flex h-9 min-w-9 items-center justify-center border-x px-2 text-sm font-semibold ${
                                  isDark
                                    ? "border-white/10"
                                    : "border-gray-200"
                                }`}
                              >
                                {item.quantity}
                              </span>

                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    1
                                  )
                                }
                                className={`flex h-9 w-9 items-center justify-center text-lg transition ${
                                  isDark
                                    ? "hover:bg-white/10"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                +
                              </button>

                            </div>

                          </div>

                          {/* REMOVE */}
                          <button
                            onClick={() =>
                              removeProduct(
                                item.product.id
                              )
                            }
                            className={`text-xs font-medium transition ${
                              isDark
                                ? "text-gray-500 hover:text-red-400"
                                : "text-gray-400 hover:text-red-500"
                            }`}
                          >
                            Remove
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                ))}

              </div>

            </div>

          </section>

          {/* RIGHT SIDE */}
          <aside>

            <div
              className={`sticky top-6 overflow-hidden rounded-3xl border shadow-xl backdrop-blur-xl ${
                isDark
                  ? "border-white/10 bg-white/[0.045]"
                  : "border-gray-200 bg-white"
              }`}
            >

              {/* TOTAL HEADER */}
              <div
                className={`border-b p-6 ${
                  isDark
                    ? "border-white/10"
                    : "border-gray-100"
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>
                    <p
                      className={`text-sm ${
                        isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Total amount
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight">
                      ${subtotal.toFixed(2)}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${
                      isDark
                        ? "bg-white/10"
                        : "bg-gray-100"
                    }`}
                  >
                    💳
                  </div>

                </div>

              </div>

              {/* BREAKDOWN */}
              <div className="p-6">

                <div className="space-y-4">

                  <div className="flex justify-between text-sm">

                    <span
                      className={
                        isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      Subtotal
                    </span>

                    <span>
                      ${subtotal.toFixed(2)}
                    </span>

                  </div>

                  <div className="flex justify-between text-sm">

                    <span
                      className={
                        isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      Marketplace fee
                    </span>

                    <span>
                      $0.00
                    </span>

                  </div>

                </div>

                <div
                  className={`my-6 border-t ${
                    isDark
                      ? "border-white/10"
                      : "border-gray-100"
                  }`}
                />

                <div className="flex items-end justify-between">

                  <span className="font-semibold">
                    Total
                  </span>

                  <span className="text-2xl font-bold">
                    ${subtotal.toFixed(2)}
                  </span>

                </div>

                {/* CRYPTO PAYMENT */}
                <div
                  className={`mt-6 rounded-2xl border p-4 ${
                    isDark
                      ? "border-white/10 bg-white/[0.025]"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isDark
                          ? "bg-white/10"
                          : "bg-white"
                      }`}
                    >
                      ₿
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Crypto Payment
                      </p>

                      <p
                        className={`mt-0.5 text-xs ${
                          isDark
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                      >
                        Pay securely with crypto
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 flex gap-2">

                    <span
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        isDark
                          ? "bg-white/5 text-gray-300"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      USDT
                    </span>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        isDark
                          ? "bg-white/5 text-gray-300"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      USDC
                    </span>

                  </div>

                </div>

                {/* CONTINUE */}
                <button
                  onClick={() => setPaymentStep(true)}
                  className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 ${
                    isDark
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-black text-white hover:opacity-85"
                  }`}
                >
                  Continue to Payment →
                </button>

                <p
                  className={`mt-4 text-center text-[11px] leading-relaxed ${
                    isDark
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  You will review your network,
                  stablecoin and connected wallet
                  before confirming the payment.
                </p>

              </div>

            </div>

          </aside>

        </div>

        {/* FOOTER */}
        <div
          className={`mt-10 pb-6 text-center text-xs ${
            isDark
              ? "text-gray-600"
              : "text-gray-400"
          }`}
        >
          Chain Market · Buy anything. Pay with crypto.
        </div>

      </div>
    </main>
  );
}
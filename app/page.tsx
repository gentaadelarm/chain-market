"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChainMarketHeader from "@/components/ChainMarketHeader";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  seller: string;
  emoji: string;
  description: string;
  rating: number;
  reviews: number;
  stock: number;
  sold: number;
  colors: string[];
  models: string[];
  sellerRating: number;
  sellerProducts: number;
  sellerResponse: number;
  sellerJoined: string;
  sellerFollowers: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 49.99,
    seller: "TechStore",
    emoji: "🎧",
    description:
      "Premium wireless headphones with immersive sound, comfortable ear cushions, and long-lasting battery life.",
    rating: 4.8,
    reviews: 124,
    stock: 25,
    sold: 842,
    colors: ["Black", "White", "Blue"],
    models: ["Standard", "Pro"],
    sellerRating: 4.9,
    sellerProducts: 128,
    sellerResponse: 98,
    sellerJoined: "March 2025",
    sellerFollowers: 1240,
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: 79.99,
    seller: "KeyHouse",
    emoji: "⌨️",
    description:
      "A premium mechanical keyboard built for gaming, programming, and everyday productivity.",
    rating: 4.9,
    reviews: 89,
    stock: 18,
    sold: 534,
    colors: ["Black", "White"],
    models: ["Blue Switch", "Red Switch", "Brown Switch"],
    sellerRating: 4.9,
    sellerProducts: 86,
    sellerResponse: 99,
    sellerJoined: "January 2025",
    sellerFollowers: 892,
  },
  {
    id: 3,
    name: "Premium Backpack",
    category: "Fashion",
    price: 39.99,
    seller: "UrbanGoods",
    emoji: "🎒",
    description:
      "Minimalist everyday backpack with multiple compartments and durable water-resistant material.",
    rating: 4.7,
    reviews: 67,
    stock: 32,
    sold: 713,
    colors: ["Black", "Gray", "Green"],
    models: ["20L", "30L"],
    sellerRating: 4.8,
    sellerProducts: 214,
    sellerResponse: 96,
    sellerJoined: "June 2024",
    sellerFollowers: 2100,
  },
  {
    id: 4,
    name: "Smart Watch",
    category: "Electronics",
    price: 129.99,
    seller: "FutureTech",
    emoji: "⌚",
    description:
      "Modern smartwatch with fitness tracking, notifications, health metrics, and a vibrant display.",
    rating: 4.6,
    reviews: 203,
    stock: 12,
    sold: 1208,
    colors: ["Black", "Silver"],
    models: ["40mm", "44mm"],
    sellerRating: 4.7,
    sellerProducts: 175,
    sellerResponse: 97,
    sellerJoined: "September 2024",
    sellerFollowers: 3400,
  },
  {
    id: 5,
    name: "Running Shoes",
    category: "Sports",
    price: 69.99,
    seller: "SportZone",
    emoji: "👟",
    description:
      "Lightweight running shoes designed for comfort, stability, and everyday training.",
    rating: 4.8,
    reviews: 156,
    stock: 40,
    sold: 935,
    colors: ["Black", "White", "Red"],
    models: ["40", "41", "42", "43", "44"],
    sellerRating: 4.8,
    sellerProducts: 342,
    sellerResponse: 98,
    sellerJoined: "April 2024",
    sellerFollowers: 2890,
  },
  {
    id: 6,
    name: "Gaming Mouse",
    category: "Gaming",
    price: 34.99,
    seller: "GameHub",
    emoji: "🖱️",
    description:
      "High-precision gaming mouse with adjustable DPI, ergonomic design, and programmable buttons.",
    rating: 4.7,
    reviews: 112,
    stock: 28,
    sold: 684,
    colors: ["Black", "White"],
    models: ["Wired", "Wireless"],
    sellerRating: 4.9,
    sellerProducts: 93,
    sellerResponse: 99,
    sellerJoined: "November 2024",
    sellerFollowers: 1780,
  },
  {
    id: 7,
    name: "Minimalist Lamp",
    category: "Home",
    price: 29.99,
    seller: "HomeSpace",
    emoji: "💡",
    description:
      "Clean minimalist desk lamp that brings a warm and modern atmosphere to any room.",
    rating: 4.5,
    reviews: 54,
    stock: 21,
    sold: 421,
    colors: ["White", "Black"],
    models: ["Desk", "Bedside"],
    sellerRating: 4.6,
    sellerProducts: 157,
    sellerResponse: 94,
    sellerJoined: "August 2024",
    sellerFollowers: 1260,
  },
  {
    id: 8,
    name: "Travel Camera",
    category: "Electronics",
    price: 299.99,
    seller: "PhotoWorld",
    emoji: "📷",
    description:
      "Compact travel camera designed for high-quality photos and videos wherever you go.",
    rating: 4.9,
    reviews: 76,
    stock: 8,
    sold: 317,
    colors: ["Black", "Silver"],
    models: ["Body Only", "18-55mm Kit"],
    sellerRating: 4.9,
    sellerProducts: 74,
    sellerResponse: 99,
    sellerJoined: "February 2024",
    sellerFollowers: 4210,
  },
];

const categories = [
  { name: "All", icon: "✨" },
  { name: "Electronics", icon: "💻" },
  { name: "Fashion", icon: "👕" },
  { name: "Gaming", icon: "🎮" },
  { name: "Home", icon: "🏠" },
  { name: "Sports", icon: "⚽" },
];

export default function Home() {
  const supabase = createClient();

  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [showStore, setShowStore] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState("");

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

    const savedCart = localStorage.getItem("chain-market-cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
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
    if (!mounted) return;

    localStorage.setItem(
      "chain-market-cart",
      JSON.stringify(cart)
    );
  }, [cart, mounted]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.seller.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, search]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowStore(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = (product: Product, amount = 1) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + amount,
                  product.stock
                ),
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: Math.min(amount, product.stock),
        },
      ];
    });

    setSelectedProduct(null);
    setShowCart(true);
  };

  const updateQuantity = (
    productId: number,
    amount: number
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const newQuantity = Math.min(
            Math.max(item.quantity + amount, 0),
            item.product.stock
          );

          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  const theme = darkMode
    ? {
        page: "bg-[#09090b] text-white",
        header: "bg-[#09090b]/95 border-zinc-800",
        input:
          "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500",
        muted: "text-zinc-400",
        card: "bg-zinc-900 border-zinc-800",
        soft: "bg-zinc-900",
        softHover: "hover:bg-zinc-800",
        border: "border-zinc-800",
      }
    : {
        page: "bg-zinc-50 text-zinc-900",
        header: "bg-white/95 border-zinc-200",
        input:
          "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400",
        muted: "text-zinc-500",
        card: "bg-white border-zinc-200",
        soft: "bg-zinc-100",
        softHover: "hover:bg-zinc-200",
        border: "border-zinc-200",
      };

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${theme.page}`}
    >
<ChainMarketHeader
  search={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search products, categories, sellers..."
  mobileSearchPlaceholder="Search products..."
  darkMode={darkMode}
  onToggleTheme={() => setDarkMode((value) => !value)}
  userEmail={userEmail}
  showCart
  cartCount={cartCount}
  onCartClick={() => setShowCart(true)}
  onLogoClick={() => {
    setSelectedProduct(null);
    setShowStore(false);
    setShowCart(false);
    setSearch("");
  }}
/>

      {/* PRODUCT DETAIL */}
      {selectedProduct ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <button
            onClick={() => setSelectedProduct(null)}
            className="mb-8 text-sm font-semibold text-blue-600"
          >
            ← Back to products
          </button>

          <div className="grid gap-10 lg:grid-cols-2">
            <div
              className={`flex aspect-square items-center justify-center rounded-3xl border text-[130px] sm:text-[190px] ${theme.card}`}
            >
              {selectedProduct.emoji}
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                {selectedProduct.category}
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                {selectedProduct.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-yellow-500">
                  {"★".repeat(
                    Math.round(selectedProduct.rating)
                  )}
                </span>

                <span className={`text-sm ${theme.muted}`}>
                  {selectedProduct.rating} ·{" "}
                  {selectedProduct.reviews} reviews ·{" "}
                  {selectedProduct.sold.toLocaleString()} sold
                </span>
              </div>

              <div className="mt-6 text-4xl font-black">
                ${selectedProduct.price.toFixed(2)}
              </div>

              <p
                className={`mt-5 leading-7 ${theme.muted}`}
              >
                {selectedProduct.description}
              </p>

              {/* SELLER */}
              <div
                className={`mt-6 rounded-2xl border p-5 ${theme.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs ${theme.muted}`}>
                      Sold by
                    </p>
                    <h3 className="mt-1 text-lg font-bold">
                      {selectedProduct.seller}
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowStore(true)}
                    className="rounded-lg border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    Kunjungi Toko
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <p className={theme.muted}>Penilaian</p>
                    <p className="mt-1 font-bold">
                      ★ {selectedProduct.sellerRating}
                    </p>
                  </div>
                  <div>
                    <p className={theme.muted}>Produk</p>
                    <p className="mt-1 font-bold">
                      {selectedProduct.sellerProducts}
                    </p>
                  </div>
                  <div>
                    <p className={theme.muted}>Chat dibalas</p>
                    <p className="mt-1 font-bold">
                      {selectedProduct.sellerResponse}%
                    </p>
                  </div>
                  <div>
                    <p className={theme.muted}>Pengikut</p>
                    <p className="mt-1 font-bold">
                      {selectedProduct.sellerFollowers.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* VARIANTS */}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((color) => (
                      <button
                        key={color}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${theme.card} hover:border-blue-500`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Model
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.models.map((model) => (
                      <button
                        key={model}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${theme.card} hover:border-blue-500`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`mt-6 flex items-center justify-between rounded-xl border p-4 ${theme.card}`}
              >
                <span className={`text-sm ${theme.muted}`}>
                  Stock
                </span>
                <span className="font-semibold">
                  {selectedProduct.stock} available
                </span>
              </div>

              {/* QUANTITY */}
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold">
                  Quantity
                </p>

                <div
                  className={`flex w-fit items-center overflow-hidden rounded-xl border ${theme.border}`}
                >
                  <button
                    onClick={() =>
                      setQuantity((value) =>
                        Math.max(value - 1, 1)
                      )
                    }
                    className={`h-11 w-11 text-lg ${theme.softHover}`}
                  >
                    −
                  </button>

                  <span className="flex h-11 w-12 items-center justify-center font-semibold">
                    {quantity}
                  </span>

                  <button
                    onClick={() =>
                      setQuantity((value) =>
                        Math.min(
                          value + 1,
                          selectedProduct.stock
                        )
                      )
                    }
                    className={`h-11 w-11 text-lg ${theme.softHover}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    addToCart(selectedProduct, quantity)
                  }
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white hover:bg-blue-700"
                >
                  Add to Cart
                </button>

                <button
                  onClick={() =>
                    addToCart(selectedProduct, quantity)
                  }
                  className={`flex-1 rounded-xl border px-6 py-4 font-bold ${theme.card} ${theme.softHover}`}
                >
                  Buy Now
                </button>
              </div>

              {/* REVIEW */}
              <div
                className={`mt-8 rounded-2xl border p-5 ${theme.card}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold">
                    Customer Reviews
                  </h3>
                  <span className={`text-xs ${theme.muted}`}>
                    Verified purchases only
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-blue-500/10 p-4">
                  <p className="text-sm font-semibold text-blue-600">
                    🔒 Review after purchase
                  </p>
                  <p
                    className={`mt-1 text-xs leading-5 ${theme.muted}`}
                  >
                    Only customers who complete checkout and
                    confirm that they received the product can
                    leave a review.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-lg px-3 py-2 text-xs ${theme.soft}`}
                >
                  🔒 Secure Checkout
                </span>
                <span
                  className={`rounded-lg px-3 py-2 text-xs ${theme.soft}`}
                >
                  🪙 USDC / USDT
                </span>
                <span
                  className={`rounded-lg px-3 py-2 text-xs ${theme.soft}`}
                >
                  ⚡ BSC / Base / Solana
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* HERO */}
          <section
            className={`border-b ${
              darkMode
                ? "border-zinc-800 bg-zinc-950"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-500">
                  🌐 The Crypto Marketplace
                </div>

                <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
                  Buy anything.
                  <br />
                  <span className="text-blue-600">
                    Pay with crypto.
                  </span>
                </h1>

                <p
                  className={`mt-6 max-w-2xl text-lg leading-8 ${theme.muted}`}
                >
                  Discover products from independent sellers
                  and pay securely using USDC or USDT across
                  BSC, Base, and Solana.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      document
                        .getElementById("products")
                        ?.scrollIntoView({
                          behavior: "smooth",
                        })
                    }
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Start Shopping
                  </button>

                  <Link
                    href="/account"
                    className={`rounded-xl border px-6 py-3 font-semibold ${theme.card} ${theme.softHover}`}
                  >
                    Become a Seller
                  </Link>
                </div>
              </div>

              <div className="mt-12 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: "🟡",
                    name: "BNB Smart Chain",
                    token: "USDT · USDC",
                  },
                  {
                    icon: "🔵",
                    name: "Base",
                    token: "USDC · USDT",
                  },
                  {
                    icon: "🟣",
                    name: "Solana",
                    token: "USDC · USDT",
                  },
                ].map((network) => (
                  <div
                    key={network.name}
                    className={`rounded-2xl border p-4 ${theme.card}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {network.icon}
                      </span>
                      <div>
                        <p className="text-sm font-bold">
                          {network.name}
                        </p>
                        <p
                          className={`mt-1 text-xs ${theme.muted}`}
                        >
                          {network.token}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CATEGORY */}
          <section className="mx-auto max-w-7xl px-6 pt-10">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Browse
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Shop by Category
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() =>
                    setSelectedCategory(category.name)
                  }
                  className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                    selectedCategory === category.name
                      ? "border-blue-600 bg-blue-600 text-white"
                      : `${theme.card} ${theme.softHover}`
                  }`}
                >
                  <div className="text-2xl">
                    {category.icon}
                  </div>
                  <p className="mt-3 text-sm font-semibold">
                    {category.name}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* CHAIN MARKET FEATURE CENTER */}
          <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                ChainMarket Platform
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Everything Web3, in one place.
              </h1>

              <p className={`mt-2 max-w-2xl text-sm ${theme.muted}`}>
                Shop products, explore crypto, and earn through staking
                from one ChainMarket platform.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">

              {/* ECOMMERCE */}
              <Link
                href="/"
                className={`group rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                    🛒
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    LIVE
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Ecommerce
                </h2>

                <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                  Buy products from sellers and pay with crypto through
                  ChainMarket.
                </p>

                <div className="mt-6 text-sm font-bold text-blue-600 transition-transform group-hover:translate-x-1">
                  Explore Marketplace →
                </div>
              </Link>

              {/* BLOCKCHAIN */}
              <Link
                href="/blockchain"
                className={`group rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                    ⛓️
                  </div>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                    COMING SOON
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Blockchain
                </h2>

                <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                  Explore crypto tokens across BSC, Base, Solana and
                  future supported networks.
                </p>

                <div className="mt-6 text-sm font-bold text-purple-600 transition-transform group-hover:translate-x-1">
                  Explore Blockchain →
                </div>
              </Link>

              {/* STAKING */}
              <Link
                href="/staking"
                className={`group rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                    💎
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    COMING SOON
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Staking
                </h2>

                <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                  Stake supported crypto assets and manage your rewards
                  from one ChainMarket dashboard.
                </p>

                <div className="mt-6 text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                  Explore Staking →
                </div>
              </Link>

            </div>
          </section>

          {/* CHAIN MARKET FEATURE CENTER */}
          <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                ChainMarket Platform
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Everything Web3, in one place.
              </h1>

              <p className={`mt-2 max-w-2xl text-sm ${theme.muted}`}>
                Shop products, explore crypto, and earn through staking
                from one ChainMarket platform.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">

              {/* ECOMMERCE */}
              <Link
                href="/"
                className={`group rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                    🛒
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    LIVE
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Ecommerce
                </h2>

                <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                  Buy products from sellers and pay with crypto through
                  ChainMarket.
                </p>

                <div className="mt-6 text-sm font-bold text-blue-600 transition-transform group-hover:translate-x-1">
                  Explore Marketplace →
                </div>
              </Link>

              {/* BLOCKCHAIN */}
              <Link
                href="/blockchain"
                className={`group rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                    ⛓️
                  </div>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                    COMING SOON
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Blockchain
                </h2>

                <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                  Explore crypto tokens across BSC, Base, Solana and
                  future supported networks.
                </p>

                <div className="mt-6 text-sm font-bold text-purple-600 transition-transform group-hover:translate-x-1">
                  Explore Blockchain →
                </div>
              </Link>

              {/* STAKING */}
              <Link
                href="/staking"
                className={`group rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                    💎
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    COMING SOON
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Staking
                </h2>

                <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                  Stake supported crypto assets and manage your rewards
                  from one ChainMarket dashboard.
                </p>

                <div className="mt-6 text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                  Explore Staking →
                </div>
              </Link>

            </div>
          </section>

          {/* PRODUCTS */}
          <section
            id="products"
            className="mx-auto max-w-7xl px-6 py-12"
          >
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  Marketplace
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Explore Products
                </h2>
                <p
                  className={`mt-1 text-sm ${theme.muted}`}
                >
                  Popular products from ChainMarket sellers
                </p>
              </div>

              <span
                className={`text-sm ${theme.muted}`}
              >
                {filteredProducts.length} products
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div
                className={`rounded-2xl border p-12 text-center ${theme.card}`}
              >
                <div className="text-4xl">🔎</div>
                <h3 className="mt-4 font-bold">
                  No products found
                </h3>
                <p
                  className={`mt-2 text-sm ${theme.muted}`}
                >
                  Try another search or category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    onClick={() => openProduct(product)}
                    className={`group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
                  >
                    <div
                      className={`relative flex aspect-square items-center justify-center text-7xl ${
                        darkMode
                          ? "bg-zinc-800 group-hover:bg-zinc-700"
                          : "bg-zinc-100 group-hover:bg-zinc-200"
                      }`}
                    >
                      {product.emoji}

                      {product.stock <= 10 && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p
                        className={`text-xs font-medium ${theme.muted}`}
                      >
                        {product.category}
                      </p>

                      <h3 className="mt-1 line-clamp-1 font-bold">
                        {product.name}
                      </h3>

                      <p
                        className={`mt-1 line-clamp-2 min-h-[32px] text-xs leading-4 ${theme.muted}`}
                      >
                        {product.description}
                      </p>

                      <div className="mt-3 flex items-center gap-1 text-xs">
                        <span className="text-yellow-500">
                          ★ {product.rating}
                        </span>
                        <span className={theme.muted}>
                          ({product.reviews})
                        </span>
                        <span className={theme.muted}>
                          · {product.sold} sold
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-black">
                          ${product.price.toFixed(2)}
                        </span>

                        <span
                          className={`text-xs ${theme.muted}`}
                        >
                          {product.stock} left
                        </span>
                      </div>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          addToCart(product);
                        }}
                        className="mt-4 w-full rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        Add to Cart
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openProduct(product);
                        }}
                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-xs font-semibold ${theme.card} ${theme.softHover}`}
                      >
                        View Product
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* CRYPTO / ESCROW */}
          <section className="mx-auto max-w-7xl px-6 pb-16">
            <div
              className={`relative overflow-hidden rounded-3xl border p-8 sm:p-12 ${theme.card}`}
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
                  CRYPTO NATIVE
                </p>

                <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-4xl">
                  Buy with stablecoins.
                  <br />
                  Protected by marketplace escrow.
                </h2>

                <p
                  className={`mt-4 max-w-2xl leading-7 ${theme.muted}`}
                >
                  Pay with USDT or USDC on BSC, Base, or Solana.
                  Your payment is held in escrow while the seller
                  processes your order. Funds are released only
                  after you confirm that your order has arrived.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-5">
                  {[
                    ["🟡", "BSC"],
                    ["🔵", "Base"],
                    ["🟣", "Solana"],
                    ["💵", "USDC"],
                    ["💲", "USDT"],
                  ].map(([icon, name]) => (
                    <div
                      key={name}
                      className={`rounded-xl border p-4 ${theme.card}`}
                    >
                      <span className="text-lg">{icon}</span>
                      <p className="mt-2 text-sm font-bold">
                        {name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-4">
                  {[
                    ["01", "Checkout", "Choose address, shipping, and payment."],
                    ["02", "Escrow", "Payment is securely held."],
                    ["03", "Delivery", "Seller ships your order."],
                    ["04", "Release", "Confirm receipt and release funds."],
                  ].map(([number, title, text]) => (
                    <div key={number}>
                      <span className="text-xs font-black text-blue-600">
                        {number}
                      </span>
                      <h3 className="mt-2 font-bold">
                        {title}
                      </h3>
                      <p
                        className={`mt-1 text-xs leading-5 ${theme.muted}`}
                      >
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* STORE MODAL */}
      {showStore && selectedProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowStore(false)}
          />

          <div
            className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${theme.card}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600">
                  STORE
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {selectedProduct.seller}
                </h2>
              </div>

              <button
                onClick={() => setShowStore(false)}
                className={`h-10 w-10 rounded-xl ${theme.soft}`}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div
                className={`rounded-2xl border p-4 ${theme.card}`}
              >
                <p className={`text-xs ${theme.muted}`}>
                  Penilaian
                </p>
                <p className="mt-1 text-xl font-black">
                  ★ {selectedProduct.sellerRating}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 ${theme.card}`}
              >
                <p className={`text-xs ${theme.muted}`}>
                  Produk dijual
                </p>
                <p className="mt-1 text-xl font-black">
                  {selectedProduct.sellerProducts}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 ${theme.card}`}
              >
                <p className={`text-xs ${theme.muted}`}>
                  Chat dibalas
                </p>
                <p className="mt-1 text-xl font-black">
                  {selectedProduct.sellerResponse}%
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 ${theme.card}`}
              >
                <p className={`text-xs ${theme.muted}`}>
                  Pengikut
                </p>
                <p className="mt-1 text-xl font-black">
                  {selectedProduct.sellerFollowers.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className={`mt-4 rounded-2xl border p-4 ${theme.card}`}
            >
              <p className={`text-xs ${theme.muted}`}>
                Bergabung sejak
              </p>
              <p className="mt-1 font-bold">
                {selectedProduct.sellerJoined}
              </p>
            </div>

            <button
              onClick={() => setShowStore(false)}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />

          <aside
            className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col shadow-2xl ${theme.page}`}
          >
            <div
              className={`flex items-center justify-between border-b px-6 py-5 ${theme.border}`}
            >
              <div>
                <h2 className="text-xl font-bold">
                  Your Cart
                </h2>
                <p
                  className={`text-sm ${theme.muted}`}
                >
                  {cartCount}{" "}
                  {cartCount === 1 ? "item" : "items"}
                </p>
              </div>

              <button
                onClick={() => setShowCart(false)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${theme.soft}`}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="text-6xl">🛒</div>

                  <h3 className="mt-5 text-xl font-bold">
                    Your cart is empty
                  </h3>

                  <p
                    className={`mt-2 text-sm ${theme.muted}`}
                  >
                    Add some products and they will appear
                    here.
                  </p>

                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className={`rounded-2xl border p-4 ${theme.card}`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-4xl ${theme.soft}`}
                        >
                          {item.product.emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2">
                            <h3 className="truncate font-semibold">
                              {item.product.name}
                            </h3>

                            <button
                              onClick={() =>
                                removeFromCart(
                                  item.product.id
                                )
                              }
                              className={`text-sm ${theme.muted} hover:text-red-500`}
                            >
                              Remove
                            </button>
                          </div>

                          <p
                            className={`mt-1 text-sm ${theme.muted}`}
                          >
                            ${item.product.price.toFixed(2)}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <div
                              className={`flex items-center overflow-hidden rounded-lg border ${theme.border}`}
                            >
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    -1
                                  )
                                }
                                className={`h-8 w-8 ${theme.softHover}`}
                              >
                                −
                              </button>

                              <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    1
                                  )
                                }
                                className={`h-8 w-8 ${theme.softHover}`}
                              >
                                +
                              </button>
                            </div>

                            <span className="font-bold">
                              $
                              {(
                                item.product.price *
                                item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div
                className={`border-t px-6 py-5 ${theme.border}`}
              >
                <div className="flex justify-between">
                  <span className={theme.muted}>
                    Subtotal
                  </span>
                  <span className="text-xl font-black">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <p
                  className={`mt-2 text-xs ${theme.muted}`}
                >
                  Shipping, discounts, and crypto payment
                  details are calculated at checkout.
                </p>

                <Link
                  href="/checkout"
                  onClick={() => setShowCart(false)}
                  className="mt-5 block w-full rounded-xl bg-blue-600 px-5 py-4 text-center font-bold text-white hover:bg-blue-700"
                >
                  Proceed to Checkout →
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`border-t ${theme.border}`}>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="text-xl font-black">
                Chain<span className="text-blue-600">Market</span>
              </div>
              <p
                className={`mt-3 text-sm leading-6 ${theme.muted}`}
              >
                Buy anything. Pay with crypto.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold">
                Marketplace
              </h3>
              <div
                className={`mt-3 space-y-2 text-sm ${theme.muted}`}
              >
                <p>Explore Products</p>
                <p>Categories</p>
                <p>Seller Center</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold">
                Account
              </h3>
              <div
                className={`mt-3 space-y-2 text-sm ${theme.muted}`}
              >
                <Link href="/account">My Account</Link>
                <br />
                <Link href="/account/settings">
                  Settings
                </Link>
                <br />
                <Link href="/account/settings/addresses">
                  Shipping Addresses
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold">
                Payments
              </h3>
              <div
                className={`mt-3 space-y-2 text-sm ${theme.muted}`}
              >
                <p>BSC · USDT / USDC</p>
                <p>Base · USDT / USDC</p>
                <p>Solana · USDT / USDC</p>
              </div>
            </div>
          </div>

          <div
            className={`mt-10 border-t pt-6 text-xs ${theme.border} ${theme.muted}`}
          >
            © 2026 ChainMarket. Crypto marketplace with
            marketplace escrow.
          </div>
        </div>
      </footer>
    </main>
  );
}

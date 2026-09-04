"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    sold: 1240,
    colors: ["Black", "White", "Blue"],
    models: ["Standard", "Pro"],
    sellerRating: 4.9,
    sellerProducts: 86,
    sellerResponse: 98,
    sellerJoined: "March 2024",
    sellerFollowers: 12400,
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
    sold: 856,
    colors: ["Black", "White"],
    models: ["Red Switch", "Blue Switch", "Brown Switch"],
    sellerRating: 4.8,
    sellerProducts: 54,
    sellerResponse: 97,
    sellerJoined: "July 2023",
    sellerFollowers: 8900,
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
    sold: 2180,
    colors: ["Black", "Gray", "Green"],
    models: ["20L", "28L"],
    sellerRating: 4.7,
    sellerProducts: 132,
    sellerResponse: 95,
    sellerJoined: "January 2023",
    sellerFollowers: 15600,
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
    sold: 742,
    colors: ["Black", "Silver", "Rose Gold"],
    models: ["40mm", "44mm"],
    sellerRating: 4.8,
    sellerProducts: 73,
    sellerResponse: 99,
    sellerJoined: "September 2022",
    sellerFollowers: 22100,
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
    sold: 3240,
    colors: ["Black", "White", "Red"],
    models: ["40", "41", "42", "43", "44"],
    sellerRating: 4.9,
    sellerProducts: 218,
    sellerResponse: 96,
    sellerJoined: "May 2021",
    sellerFollowers: 31800,
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
    sold: 1670,
    colors: ["Black", "White"],
    models: ["Wired", "Wireless"],
    sellerRating: 4.8,
    sellerProducts: 94,
    sellerResponse: 98,
    sellerJoined: "November 2023",
    sellerFollowers: 9700,
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
    sold: 930,
    colors: ["White", "Black", "Beige"],
    models: ["Desk", "Bedside"],
    sellerRating: 4.6,
    sellerProducts: 61,
    sellerResponse: 94,
    sellerJoined: "February 2024",
    sellerFollowers: 6200,
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
    sold: 421,
    colors: ["Black", "Silver"],
    models: ["Body Only", "Kit Lens"],
    sellerRating: 4.9,
    sellerProducts: 47,
    sellerResponse: 99,
    sellerJoined: "August 2020",
    sellerFollowers: 19400,
  },
];

const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Gaming",
  "Home",
  "Sports",
];

const cryptoNetworks = [
  {
    name: "BSC",
    description: "Fast & low-cost",
    icon: "🟡",
  },
  {
    name: "Base",
    description: "Ethereum L2",
    icon: "🔵",
  },
  {
    name: "Solana",
    description: "High performance",
    icon: "🟣",
  },
];

export default function Home() {
  const supabase = createClient();

  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [selectedStore, setSelectedStore] =
    useState<Product | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [selectedColor, setSelectedColor] =
    useState<string | null>(null);

  const [selectedModel, setSelectedModel] =
    useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      "chain-market-theme"
    );

    if (savedTheme === "dark") {
      setDarkMode(true);
    } else if (savedTheme === "light") {
      setDarkMode(false);
    } else {
      setDarkMode(
        window.matchMedia("(prefers-color-scheme: dark)")
          .matches
      );
    }

    const savedCart = localStorage.getItem(
      "chain-market-cart"
    );

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

      if (user) {
        setUserEmail(user.email ?? null);
      }
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
        (product) =>
          product.category === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.seller.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedColor(product.colors[0] ?? null);
    setSelectedModel(product.models[0] ?? null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const addToCart = (
    product: Product,
    amount = 1
  ) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) =>
          item.product.id === product.id
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
          quantity: Math.min(
            amount,
            product.stock
          ),
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
          if (
            item.product.id !== productId
          ) {
            return item;
          }

          const newQuantity = Math.min(
            Math.max(
              item.quantity + amount,
              0
            ),
            item.product.stock
          );

          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  const removeFromCart = (
    productId: number
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.product.id !== productId
      )
    );
  };

  const theme = darkMode
    ? {
        page: "bg-[#09090b] text-white",
        header:
          "bg-[#09090b]/95 border-zinc-800",
        topbar:
          "bg-zinc-950 border-zinc-800",
        input:
          "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500",
        muted: "text-zinc-400",
        card:
          "bg-zinc-900 border-zinc-800",
        soft: "bg-zinc-900",
        softHover:
          "hover:bg-zinc-800",
        border: "border-zinc-800",
        secondary:
          "bg-zinc-900 hover:bg-zinc-800",
      }
    : {
        page:
          "bg-[#f8fafc] text-zinc-900",
        header:
          "bg-white/95 border-zinc-200",
        topbar:
          "bg-white border-zinc-200",
        input:
          "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400",
        muted: "text-zinc-500",
        card:
          "bg-white border-zinc-200",
        soft: "bg-zinc-100",
        softHover:
          "hover:bg-zinc-200",
        border: "border-zinc-200",
        secondary:
          "bg-white hover:bg-zinc-50",
      };

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${theme.page}`}
    >
      {/* TOP BAR */}
      <div
        className={`border-b text-xs ${theme.topbar}`}
      >
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
            <button
              className={`${theme.muted} hover:text-blue-600`}
            >
              Bantuan
            </button>

            <button
              className={`${theme.muted} hover:text-blue-600`}
            >
              Bahasa
            </button>

            <span className={theme.muted}>
              |
            </span>

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
          <button
            onClick={() => {
              setSelectedProduct(null);
              setSelectedStore(null);
              setShowCart(false);
              setSearchQuery("");
            }}
            className="shrink-0 text-2xl font-black tracking-tight"
          >
            Chain
            <span className="text-blue-600">
              Market
            </span>
          </button>

          {/* SEARCH */}
          <div className="hidden flex-1 md:block">
            <div
              className={`mx-auto flex max-w-2xl items-center rounded-xl border px-4 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 ${theme.input}`}
            >
              <span
                className={`mr-3 text-lg ${theme.muted}`}
              >
                ⌕
              </span>

              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="Search products, categories, sellers..."
              />

              {searchQuery && (
                <button
                  onClick={() =>
                    setSearchQuery("")
                  }
                  className={theme.muted}
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
          <button
            onClick={() => setShowCart(true)}
            className={`relative rounded-xl p-2.5 text-xl transition-colors ${theme.softHover}`}
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
            onClick={() =>
              setDarkMode(
                (value) => !value
              )
            }
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors ${theme.soft} ${theme.softHover}`}
            aria-label="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

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
            <span
              className={`mr-3 ${theme.muted}`}
            >
              ⌕
            </span>

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              className="w-full bg-transparent py-2 text-sm outline-none"
              placeholder="Search products..."
            />
          </div>
        </div>
      </header>

      {/* PRODUCT DETAIL */}
      {selectedProduct ? (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <button
            onClick={() =>
              setSelectedProduct(null)
            }
            className="mb-8 text-sm font-semibold text-blue-600"
          >
            ← Back to products
          </button>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* PRODUCT IMAGE */}
            <div>
              <div
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border ${theme.card}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />

                <span className="relative text-[150px] sm:text-[200px]">
                  {selectedProduct.emoji}
                </span>
              </div>

              {/* STORE CARD */}
              <div
                className={`mt-5 rounded-2xl border p-5 ${theme.card}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-xs ${theme.muted}`}
                    >
                      Sold by
                    </p>

                    <h3 className="mt-1 text-lg font-bold">
                      {selectedProduct.seller}
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedStore(
                        selectedProduct
                      )
                    }
                    className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-500/20"
                  >
                    Kunjungi Toko
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p
                      className={`text-xs ${theme.muted}`}
                    >
                      Rating
                    </p>
                    <p className="mt-1 font-bold">
                      ⭐{" "}
                      {selectedProduct.sellerRating}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs ${theme.muted}`}
                    >
                      Products
                    </p>
                    <p className="mt-1 font-bold">
                      {selectedProduct.sellerProducts}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs ${theme.muted}`}
                    >
                      Chat dibalas
                    </p>
                    <p className="mt-1 font-bold">
                      {selectedProduct.sellerResponse}%
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs ${theme.muted}`}
                    >
                      Pengikut
                    </p>
                    <p className="mt-1 font-bold">
                      {selectedProduct.sellerFollowers.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT INFO */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600">
                  {selectedProduct.category}
                </span>

                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                  ✓ In Stock
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                {selectedProduct.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-yellow-500">
                  {"★".repeat(
                    Math.round(
                      selectedProduct.rating
                    )
                  )}
                </span>

                <span className="text-sm font-semibold">
                  {selectedProduct.rating}
                </span>

                <span
                  className={`text-sm ${theme.muted}`}
                >
                  {selectedProduct.reviews} reviews
                </span>

                <span
                  className={`text-sm ${theme.muted}`}
                >
                  • {selectedProduct.sold.toLocaleString()} sold
                </span>
              </div>

              <div className="mt-7 text-4xl font-black">
                ${selectedProduct.price.toFixed(2)}
              </div>

              <p
                className={`mt-5 text-base leading-7 ${theme.muted}`}
              >
                {selectedProduct.description}
              </p>

              {/* COLORS */}
              {selectedProduct.colors.length >
                0 && (
                <div className="mt-7">
                  <p className="mb-3 text-sm font-bold">
                    Color
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setSelectedColor(
                              color
                            )
                          }
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                            selectedColor ===
                            color
                              ? "border-blue-600 bg-blue-600 text-white"
                              : `${theme.card} ${theme.softHover}`
                          }`}
                        >
                          {color}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* MODEL */}
              {selectedProduct.models.length >
                0 && (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-bold">
                    Model / Variant
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.models.map(
                      (model) => (
                        <button
                          key={model}
                          onClick={() =>
                            setSelectedModel(
                              model
                            )
                          }
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                            selectedModel ===
                            model
                              ? "border-blue-600 bg-blue-600 text-white"
                              : `${theme.card} ${theme.softHover}`
                          }`}
                        >
                          {model}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* STOCK */}
              <div
                className={`mt-6 flex items-center justify-between rounded-xl border p-4 ${theme.card}`}
              >
                <div>
                  <p
                    className={`text-xs ${theme.muted}`}
                  >
                    Stock tersedia
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedProduct.stock} units
                  </p>
                </div>

                <div>
                  <p
                    className={`text-xs text-right ${theme.muted}`}
                  >
                    Terjual
                  </p>

                  <p className="mt-1 text-right font-bold">
                    {selectedProduct.sold.toLocaleString()}
                  </p>
                </div>
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
                      setQuantity(
                        (value) =>
                          Math.max(
                            value - 1,
                            1
                          )
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
                      setQuantity(
                        (value) =>
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
                    addToCart(
                      selectedProduct,
                      quantity
                    )
                  }
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                >
                  🛒 Add to Cart
                </button>

                <button
                  onClick={() => {
                    addToCart(
                      selectedProduct,
                      quantity
                    );
                  }}
                  className={`flex-1 rounded-xl border px-6 py-4 font-bold transition-colors ${theme.card} ${theme.softHover}`}
                >
                  Buy Now
                </button>
              </div>

              {/* TRUST */}
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div
                  className={`rounded-xl px-3 py-3 text-center text-xs ${theme.soft}`}
                >
                  🔒 Secure Checkout
                </div>

                <div
                  className={`rounded-xl px-3 py-3 text-center text-xs ${theme.soft}`}
                >
                  🪙 USDC / USDT
                </div>

                <div
                  className={`rounded-xl px-3 py-3 text-center text-xs ${theme.soft}`}
                >
                  ⚡ 3 Networks
                </div>
              </div>

              {/* REVIEW */}
              <div
                className={`mt-8 rounded-2xl border p-5 ${theme.card}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">
                      Customer Reviews
                    </h3>

                    <p
                      className={`mt-1 text-xs ${theme.muted}`}
                    >
                      {selectedProduct.reviews} verified
                      customer reviews
                    </p>
                  </div>

                  <span className="text-lg font-bold">
                    ⭐ {selectedProduct.rating}
                  </span>
                </div>

                <div className="mt-5 border-t border-zinc-200/10 pt-5">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      A
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          Verified Buyer
                        </span>

                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                          ✓ Verified Purchase
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-yellow-500">
                        ★★★★★
                      </div>

                      <p
                        className={`mt-2 text-sm leading-6 ${theme.muted}`}
                      >
                        Customer reviews will be available
                        to users who completed checkout and
                        received the product.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* HERO */}
          <section
            className={`relative overflow-hidden border-b ${
              darkMode
                ? "border-zinc-800 bg-zinc-950"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.10),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(124,58,237,0.08),transparent_35%)]" />

            <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-24">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600">
                  🌐 The Crypto Marketplace
                </div>

                <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
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
                        .getElementById(
                          "products"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                        })
                    }
                    className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
                  >
                    Start Shopping →
                  </button>

                  <button className="rounded-xl border border-zinc-300 bg-white/70 px-6 py-3.5 font-semibold backdrop-blur transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/70 dark:hover:bg-zinc-800">
                    Become a Seller
                  </button>
                </div>

                <div className="mt-10 flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="font-bold">
                      3
                    </p>
                    <p className={theme.muted}>
                      Networks
                    </p>
                  </div>

                  <div>
                    <p className="font-bold">
                      2
                    </p>
                    <p className={theme.muted}>
                      Stablecoins
                    </p>
                  </div>

                  <div>
                    <p className="font-bold">
                      100%
                    </p>
                    <p className={theme.muted}>
                      Crypto Native
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          <section
            id="categories"
            className="mx-auto max-w-7xl px-6 pt-10"
          >
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Browse
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Shop by Category
                </h2>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(
                (category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                    className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                      selectedCategory ===
                      category
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : `${theme.soft} ${theme.muted} ${theme.softHover}`
                    }`}
                  >
                    {category}
                  </button>
                )
              )}
            </div>
          </section>

          {/* PRODUCTS */}
          <section
            id="products"
            className="mx-auto max-w-7xl px-6 py-12"
          >
            <div className="mb-7 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Discover
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  Explore Products
                </h2>

                <p
                  className={`mt-2 text-sm ${theme.muted}`}
                >
                  Popular products from Chain Market
                  sellers
                </p>
              </div>

              <span
                className={`hidden text-sm sm:block ${theme.muted}`}
              >
                {filteredProducts.length} products
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div
                className={`rounded-3xl border p-16 text-center ${theme.card}`}
              >
                <div className="text-5xl">
                  🔎
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No products found
                </h3>

                <p
                  className={`mt-2 text-sm ${theme.muted}`}
                >
                  Try another search or category.
                </p>

                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(
                      "All"
                    );
                  }}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map(
                  (product) => (
                    <article
                      key={product.id}
                      onClick={() =>
                        openProduct(
                          product
                        )
                      }
                      className={`group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
                    >
                      {/* IMAGE */}
                      <div
                        className={`relative flex aspect-square items-center justify-center overflow-hidden transition-colors ${
                          darkMode
                            ? "bg-zinc-800 group-hover:bg-zinc-700"
                            : "bg-zinc-100 group-hover:bg-zinc-200"
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />

                        <span className="relative text-7xl transition-transform duration-300 group-hover:scale-110">
                          {product.emoji}
                        </span>

                        <span className="absolute left-3 top-3 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold text-white">
                          In Stock
                        </span>
                      </div>

                      {/* CONTENT */}
                      <div className="p-4">
                        <p
                          className={`text-[11px] font-semibold uppercase tracking-wide ${theme.muted}`}
                        >
                          {product.category}
                        </p>

                        <h3 className="mt-1 line-clamp-1 font-bold">
                          {product.name}
                        </h3>

                        <p
                          className={`mt-1 line-clamp-2 text-xs leading-5 ${theme.muted}`}
                        >
                          {product.description}
                        </p>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();

                            setSelectedStore(
                              product
                            );
                          }}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          {product.seller} →
                        </button>

                        {/* RATING */}
                        <div className="mt-3 flex items-center gap-1 text-xs">
                          <span className="text-yellow-500">
                            ★
                          </span>

                          <span className="font-semibold">
                            {product.rating}
                          </span>

                          <span
                            className={theme.muted}
                          >
                            ({product.reviews})
                          </span>

                          <span
                            className={`ml-auto ${theme.muted}`}
                          >
                            {product.sold.toLocaleString()} sold
                          </span>
                        </div>

                        {/* PRICE */}
                        <div className="mt-4 flex items-end justify-between gap-2">
                          <div>
                            <span className="text-lg font-black">
                              $
                              {product.price.toFixed(
                                2
                              )}
                            </span>

                            <p
                              className={`mt-0.5 text-[10px] ${theme.muted}`}
                            >
                              {product.stock} left
                            </p>
                          </div>

                          <button
                            onClick={(event) => {
                              event.stopPropagation();

                              addToCart(
                                product
                              );
                            }}
                            className="rounded-xl bg-zinc-900 px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 dark:bg-white dark:text-zinc-900 dark:hover:bg-blue-500 dark:hover:text-white"
                          >
                            + Add
                          </button>
                        </div>

                        {/* VARIANTS */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {product.colors
                            .slice(0, 3)
                            .map(
                              (color) => (
                                <span
                                  key={color}
                                  className={`rounded-md px-2 py-1 text-[9px] ${theme.soft}`}
                                >
                                  {color}
                                </span>
                              )
                            )}
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          {/* CRYPTO PAYMENT */}
          <section className="mx-auto max-w-7xl px-6 pb-16">
            <div
              className={`relative overflow-hidden rounded-[2rem] border p-8 sm:p-12 ${theme.card}`}
            >
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

              <div className="relative">
                <div className="max-w-2xl">
                  <div className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600">
                    CRYPTO NATIVE
                  </div>

                  <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                    Pay with USDT / USDC
                  </h2>

                  <p
                    className={`mt-4 leading-7 ${theme.muted}`}
                  >
                    Choose your preferred network at
                    checkout. Chain Market supports
                    stablecoin payments across three
                    major blockchain networks.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  {cryptoNetworks.map(
                    (network) => (
                      <div
                        key={network.name}
                        className={`rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${theme.card}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.soft}`}
                          >
                            <span className="text-xl">
                              {network.icon}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold">
                              {network.name}
                            </h3>

                            <p
                              className={`text-xs ${theme.muted}`}
                            >
                              {network.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <span
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${theme.soft}`}
                          >
                            USDT
                          </span>

                          <span
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${theme.soft}`}
                          >
                            USDC
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div
                  className={`mt-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${theme.card}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      🔐
                    </span>

                    <div>
                      <p className="text-sm font-bold">
                        Marketplace Escrow
                      </p>

                      <p
                        className={`text-xs ${theme.muted}`}
                      >
                        Payment is held until you confirm
                        your order is received.
                      </p>
                    </div>
                  </div>

                  <span className="whitespace-nowrap text-xs font-semibold text-green-600">
                    Buyer Protection
                  </span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* STORE MODAL */}
      {selectedStore && (
        <div className="fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              setSelectedStore(null)
            }
          />

          <div
            className={`absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border p-6 shadow-2xl ${theme.card}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-xs ${theme.muted}`}
                >
                  Official Store
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {selectedStore.seller}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">
                    ★
                  </span>

                  <span className="font-semibold">
                    {selectedStore.sellerRating}
                  </span>

                  <span
                    className={theme.muted}
                  >
                    •{" "}
                    {selectedStore.sellerFollowers.toLocaleString()}{" "}
                    followers
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedStore(null)
                }
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme.soft} ${theme.softHover}`}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div
                className={`rounded-2xl p-4 ${theme.soft}`}
              >
                <p
                  className={`text-xs ${theme.muted}`}
                >
                  Products
                </p>

                <p className="mt-1 text-xl font-black">
                  {selectedStore.sellerProducts}
                </p>
              </div>

              <div
                className={`rounded-2xl p-4 ${theme.soft}`}
              >
                <p
                  className={`text-xs ${theme.muted}`}
                >
                  Chat Response
                </p>

                <p className="mt-1 text-xl font-black">
                  {selectedStore.sellerResponse}%
                </p>
              </div>

              <div
                className={`rounded-2xl p-4 ${theme.soft}`}
              >
                <p
                  className={`text-xs ${theme.muted}`}
                >
                  Joined
                </p>

                <p className="mt-1 font-bold">
                  {selectedStore.sellerJoined}
                </p>
              </div>

              <div
                className={`rounded-2xl p-4 ${theme.soft}`}
              >
                <p
                  className={`text-xs ${theme.muted}`}
                >
                  Followers
                </p>

                <p className="mt-1 font-bold">
                  {selectedStore.sellerFollowers.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedProduct(
                  selectedStore
                );
                setSelectedStore(null);
                setQuantity(1);
                setSelectedColor(
                  selectedStore.colors[0] ??
                    null
                );
                setSelectedModel(
                  selectedStore.models[0] ??
                    null
                );
              }}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700"
            >
              View Store Products
            </button>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setShowCart(false)
            }
          />

          <aside
            className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col shadow-2xl ${theme.page}`}
          >
            {/* CART HEADER */}
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
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCart(false)
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${theme.soft} ${theme.softHover}`}
              >
                ×
              </button>
            </div>

            {/* CART ITEMS */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="text-6xl">
                    🛒
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    Your cart is empty
                  </h3>

                  <p
                    className={`mt-2 text-sm ${theme.muted}`}
                  >
                    Add some products and they will
                    appear here.
                  </p>

                  <button
                    onClick={() =>
                      setShowCart(false)
                    }
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
                            $
                            {item.product.price.toFixed(
                              2
                            )}
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

            {/* CART FOOTER */}
            {cart.length > 0 && (
              <div
                className={`border-t px-6 py-5 ${theme.border}`}
              >
                <div className="flex justify-between">
                  <span
                    className={theme.muted}
                  >
                    Subtotal
                  </span>

                  <span className="text-xl font-black">
                    $
                    {cartTotal.toFixed(2)}
                  </span>
                </div>

                <p
                  className={`mt-2 text-xs ${theme.muted}`}
                >
                  Shipping, discounts and crypto payment
                  options are calculated at checkout.
                </p>

                <Link
                  href="/checkout"
                  onClick={() =>
                    setShowCart(false)
                  }
                  className="mt-5 block w-full rounded-xl bg-blue-600 px-5 py-4 text-center font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Proceed to Checkout →
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* FOOTER */}
      <footer
        className={`border-t ${theme.border}`}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="text-xl font-black">
                Chain
                <span className="text-blue-600">
                  Market
                </span>
              </div>

              <p
                className={`mt-3 max-w-xs text-sm leading-6 ${theme.muted}`}
              >
                Buy anything. Pay with crypto.
              </p>
            </div>

            <div>
              <h3 className="font-bold">
                Marketplace
              </h3>

              <div
                className={`mt-4 space-y-2 text-sm ${theme.muted}`}
              >
                <button className="block hover:text-blue-600">
                  All Products
                </button>

                <button className="block hover:text-blue-600">
                  Categories
                </button>

                <button className="block hover:text-blue-600">
                  Seller Center
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold">
                Account
              </h3>

              <div
                className={`mt-4 space-y-2 text-sm ${theme.muted}`}
              >
                <Link
                  href="/account"
                  className="block hover:text-blue-600"
                >
                  My Account
                </Link>

                <Link
                  href="/account/settings"
                  className="block hover:text-blue-600"
                >
                  Settings
                </Link>

                <Link
                  href="/checkout"
                  className="block hover:text-blue-600"
                >
                  Checkout
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold">
                Payments
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "BSC",
                  "Base",
                  "Solana",
                  "USDT",
                  "USDC",
                ].map((item) => (
                  <span
                    key={item}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${theme.soft}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`mt-10 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between ${theme.border} ${theme.muted}`}
          >
            <span>
              © 2026 Chain Market
            </span>

            <span>
              Crypto marketplace built for the next
              generation of commerce.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChainMarketHeader from "@/components/ChainMarketHeader";
import { useAuth } from "@/components/AuthProvider";
import { products } from "@/lib/products";

function ProductsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort");

  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);

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
  }, []);

  const toggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem(
        "chain-market-theme",
        next ? "dark" : "light"
      );
      return next;
    });
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.seller.toLowerCase().includes(query)
    );
  }, [search]);

  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];

    if (sort === "best") {
      return result.sort((a, b) => b.sold - a.sold);
    }

    if (sort === "recommended") {
      return result.sort((a, b) => {
        const scoreA =
          a.rating * 10 +
          a.sold * 0.1 +
          a.reviews * 0.05;

        const scoreB =
          b.rating * 10 +
          b.sold * 0.1 +
          b.reviews * 0.05;

        return scoreB - scoreA;
      });
    }

    return result;
  }, [filteredProducts, sort]);

  const theme = darkMode
    ? {
        page: "bg-[#09090b] text-white",
        input:
          "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500",
        card: "border-zinc-800 bg-zinc-900",
        image: "bg-zinc-800",
        muted: "text-zinc-400",
        border: "border-zinc-800",
        soft: "bg-zinc-900",
        softHover: "hover:bg-zinc-800",
      }
    : {
        page: "bg-white text-zinc-900",
        input:
          "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400",
        card: "border-zinc-200 bg-white",
        image: "bg-zinc-100",
        muted: "text-zinc-500",
        border: "border-zinc-200",
        soft: "bg-zinc-100",
        softHover: "hover:bg-zinc-200",
      };

  const heading =
    sort === "recommended"
      ? "✨ Recommended for You"
      : sort === "best"
        ? "🔥 Best Selling Products"
        : "🛍️ All Products";

  const description =
    sort === "recommended"
      ? "Products selected based on relevance, popularity, ratings, and customer activity."
      : sort === "best"
        ? "The most popular products based on sales."
        : "Explore all products available on ChainMarket.";

  return (
    <main
      className={`min-h-screen transition-colors ${theme.page}`}
    >
      <ChainMarketHeader
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products, categories, sellers..."
        mobileSearchPlaceholder="Search products..."
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        userEmail={user?.email ?? null}
        showCart={true}
        cartCount={0}
        onLogoClick={() => {
          window.location.href = "/";
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Marketplace
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {heading}
          </h1>

          <p className={`mt-2 text-sm ${theme.muted}`}>
            {description}
          </p>
        </div>

        <div
          className={`mb-6 flex items-center justify-between border-b pb-4 ${theme.border}`}
        >
          <div>
            <p className={`text-sm ${theme.muted}`}>
              {sortedProducts.length} products
            </p>
          </div>

          <Link
            href="/"
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${theme.border} ${theme.softHover}`}
          >
            ← Marketplace Home
          </Link>
        </div>

        {sortedProducts.length === 0 ? (
          <div
            className={`rounded-2xl border p-12 text-center ${theme.card}`}
          >
            <p className="text-lg font-bold">
              No products found
            </p>

            <p className={`mt-2 text-sm ${theme.muted}`}>
              Try another search keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {sortedProducts.map((product) => (
              <article
                key={product.id}
                className={`group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div
                  className={`relative flex h-[200px] items-center justify-center text-6xl transition-colors ${theme.image}`}
                >
                  {product.emoji}

                  {product.stock <= 10 && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                      Low Stock
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className={`text-xs font-medium ${theme.muted}`}>
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

                    <span className={`text-xs ${theme.muted}`}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#09090b] text-white">
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-zinc-400">Loading products...</p>
          </div>
        </main>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}

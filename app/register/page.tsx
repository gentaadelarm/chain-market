"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          user_code: `CM-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Registration successful. Check your email to confirm your account."
    );

    setLoading(false);
  }

  async function handleGoogle() {
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    }
  }

  async function handleFacebook() {
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black">Chain Market</div>

          <p className="mt-2 text-gray-500">
            Buy anything. Pay with crypto.
          </p>
        </div>

        <div className="rounded-2xl border p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Join Chain Market today
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogle}
              className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50"
            >
              Continue with Google
            </button>

            <button
              onClick={handleFacebook}
              className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50"
            >
              Continue with Facebook
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-xs text-gray-400">
              OR
            </span>

            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            {message && (
              <div className="rounded-xl bg-gray-100 p-3 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-white underline hover:text-gray-300"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

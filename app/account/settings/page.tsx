import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <a
          href="/account"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to Account
        </a>

        <div className="mt-6">
          <h1 className="text-3xl font-bold">
            Account Settings
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your Chain Market account.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <section className="rounded-2xl border p-6">
            <div className="text-2xl">👤</div>

            <h2 className="mt-4 text-lg font-semibold">
              Account
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your account information.
            </p>

            <div className="mt-6">
              <p className="text-xs text-gray-500">
                Email
              </p>

              <p className="mt-1 break-all text-sm font-medium">
                {user.email}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border p-6">
            <div className="text-2xl">🔐</div>

            <h2 className="mt-4 text-lg font-semibold">
              Security
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Manage your login and security settings.
            </p>

            <button
              className="mt-6 rounded-xl border px-4 py-2 text-sm font-medium"
            >
              Security Settings
            </button>
          </section>

          <a
            href="/account/settings/wallets"
            className="rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-2xl">💳</div>

            <h2 className="mt-4 text-lg font-semibold">
              Wallets
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Connect wallets for crypto payments.
            </p>

            <div className="mt-6 text-sm font-semibold">
              Manage Wallets →
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}

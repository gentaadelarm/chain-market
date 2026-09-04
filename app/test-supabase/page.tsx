import { createClient } from "@/lib/supabase/server";

export default async function TestSupabase() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">
          Supabase Connection Test
        </h1>

        {error ? (
          <p className="text-red-500">
            Error: {error.message}
          </p>
        ) : (
          <p className="text-green-600">
            Supabase connected successfully!
          </p>
        )}

        <pre className="mt-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </main>
  );
}

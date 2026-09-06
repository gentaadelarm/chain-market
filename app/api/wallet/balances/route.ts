import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanWalletPortfolio } from "@/lib/server/blockchain-balances";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      data: wallets,
      error: walletError,
    } = await supabase
      .from("wallets")
      .select("id,user_id,chain,address")
      .eq("user_id", user.id);

    if (walletError) {
      return NextResponse.json(
        { error: walletError.message },
        { status: 500 }
      );
    }

    if (!wallets?.length) {
      return NextResponse.json({
        wallets: [],
        balances: [],
      });
    }

    const balances = await scanWalletPortfolio({
      wallets,
    });

    return NextResponse.json({
      wallets,
      balances,
    });
  } catch (error) {
    console.error(
      "Wallet portfolio scan error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal membaca portfolio wallet.",
      },
      { status: 500 }
    );
  }
}

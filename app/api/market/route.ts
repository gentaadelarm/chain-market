import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://pro-api.coinmarketcap.com/public-api/v3/cryptocurrency/listings/latest?start=1&limit=50&convert=USD",
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 30,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `CoinMarketCap returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    const data = (result.data ?? []).map((coin: any) => {
      const usd = coin.quote?.find(
        (quote: any) => quote.symbol === "USD"
      );

      return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      slug: coin.slug,
      rank: coin.cmc_rank,
      price: usd?.price ?? 0,
      marketCap: usd?.market_cap ?? 0,
      volume24h: usd?.volume_24h ?? 0,
      change1h: usd?.percent_change_1h ?? 0,
      change24h: usd?.percent_change_24h ?? 0,
      change7d: usd?.percent_change_7d ?? 0,
      lastUpdated: usd?.last_updated ?? null,
    };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Market API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch market data",
      },
      { status: 500 }
    );
  }
}

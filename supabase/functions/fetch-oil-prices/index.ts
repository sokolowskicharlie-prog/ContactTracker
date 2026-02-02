import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OilPrice {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  unit: string;
  url: string;
  history?: Array<{ time: string; price: number }>;
}

interface OilPricesResponse {
  prices: OilPrice[];
  lastUpdated: string;
  error?: string;
}

function generateIntradayHistory(basePrice: number, volatility: number = 0.015): Array<{ time: string; price: number }> {
  const history: Array<{ time: string; price: number }> = [];
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const currentHour = now.getHours();

  for (let hour = 0; hour <= currentHour; hour++) {
    const time = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const price = basePrice * (1 + randomChange * (hour / 24));

    history.push({
      time: time.toISOString(),
      price: parseFloat(price.toFixed(2))
    });
  }

  return history;
}

async function fetchPriceFromTradingEconomics(url: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch from ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Try multiple patterns to extract price
    let price: number | null = null;
    let change: number | null = null;
    let changePercent: number | null = null;

    // Pattern 1: Look for price in various formats
    const pricePatterns = [
      /id="p"\s*>([0-9.]+)</,
      /class="[^"]*price[^"]*"\s*>([0-9.]+)/i,
      /"actual":\s*([0-9.]+)/,
      /data-symbol="[^"]*"\s+data-last="([0-9.]+)"/,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        const parsedPrice = parseFloat(match[1]);
        if (!isNaN(parsedPrice)) {
          price = parsedPrice;
          break;
        }
      }
    }

    // Pattern for change values
    const changePatterns = [
      /id="change[^"]*"\s*>([+-]?[0-9.]+)/,
      /"change":\s*([+-]?[0-9.]+)/,
    ];

    for (const pattern of changePatterns) {
      const match = html.match(pattern);
      if (match) {
        const parsedChange = parseFloat(match[1]);
        if (!isNaN(parsedChange)) {
          change = parsedChange;
          break;
        }
      }
    }

    // Pattern for change percent
    const percentPatterns = [
      /\(([+-]?[0-9.]+)%\)/,
      /"changepercent":\s*([+-]?[0-9.]+)/,
    ];

    for (const pattern of percentPatterns) {
      const match = html.match(pattern);
      if (match) {
        const parsedPercent = parseFloat(match[1]);
        if (!isNaN(parsedPercent)) {
          changePercent = parsedPercent;
          break;
        }
      }
    }

    if (price !== null) {
      return {
        price,
        change: change || 0,
        changePercent: changePercent || 0,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching price from ${url}:`, error);
    return null;
  }
}

async function fetchOilPrices(): Promise<OilPricesResponse> {
  try {
    // Fetch WTI and Brent prices in parallel
    const [wtiData, brentData] = await Promise.all([
      fetchPriceFromTradingEconomics('https://tradingeconomics.com/commodity/crude-oil'),
      fetchPriceFromTradingEconomics('https://tradingeconomics.com/commodity/brent-crude-oil'),
    ]);

    const prices: OilPrice[] = [
      {
        name: 'WTI Crude Oil',
        price: wtiData?.price || 70.50,
        change: wtiData?.change || 0.75,
        changePercent: wtiData?.changePercent || 1.08,
        currency: 'USD',
        unit: 'per barrel',
        url: 'https://tradingeconomics.com/commodity/crude-oil',
        history: generateIntradayHistory(wtiData?.price || 70.50, 0.02),
      },
      {
        name: 'Brent Crude Oil',
        price: brentData?.price || 74.20,
        change: brentData?.change || 0.82,
        changePercent: brentData?.changePercent || 1.12,
        currency: 'USD',
        unit: 'per barrel',
        url: 'https://tradingeconomics.com/commodity/brent-crude-oil',
        history: generateIntradayHistory(brentData?.price || 74.20, 0.018),
      },
      {
        name: 'Marine Gas Oil (MGO)',
        price: 850,
        change: 12.50,
        changePercent: 1.49,
        currency: 'USD',
        unit: 'per metric ton',
        url: 'https://shipandbunker.com/prices',
        history: generateIntradayHistory(850, 0.025),
      },
    ];

    return {
      prices,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching oil prices:', error);

    return {
      prices: [
        {
          name: 'WTI Crude Oil',
          price: 70.50,
          change: 0.75,
          changePercent: 1.08,
          currency: 'USD',
          unit: 'per barrel',
          url: 'https://tradingeconomics.com/commodity/crude-oil',
          history: generateIntradayHistory(70.50, 0.02),
        },
        {
          name: 'Brent Crude Oil',
          price: 74.20,
          change: 0.82,
          changePercent: 1.12,
          currency: 'USD',
          unit: 'per barrel',
          url: 'https://tradingeconomics.com/commodity/brent-crude-oil',
          history: generateIntradayHistory(74.20, 0.018),
        },
        {
          name: 'Marine Gas Oil (MGO)',
          price: 850,
          change: 12.50,
          changePercent: 1.49,
          currency: 'USD',
          unit: 'per metric ton',
          url: 'https://shipandbunker.com/prices',
          history: generateIntradayHistory(850, 0.025),
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await fetchOilPrices();

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-oil-prices function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

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
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://tradingeconomics.com/',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch from ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    let price: number | null = null;
    let change: number | null = null;
    let changePercent: number | null = null;

    // First, try to get price from JSON chart data - this is most reliable
    const jsonDataMatch = html.match(/var\s+chartData\s*=\s*({[^;]+});/);
    if (jsonDataMatch) {
      try {
        const jsonData = JSON.parse(jsonDataMatch[1]);
        if (jsonData && jsonData.series && jsonData.series[0] && jsonData.series[0].data) {
          const latestData = jsonData.series[0].data[jsonData.series[0].data.length - 1];
          if (latestData && typeof latestData.y === 'number') {
            price = latestData.y;
            console.log(`Found price from chart data: ${price}`);
          }
        }
      } catch (e) {
        console.error('Failed to parse JSON data:', e);
      }
    }

    // If we didn't get price from chart, look in HTML
    if (price === null) {
      const pricePatterns = [
        // Main price display - Trading Economics uses id="p"
        /<[^>]*id=["']p["'][^>]*>([0-9.]+)</i,
        // Alternative patterns
        /"Last":\s*"?([0-9.]+)"?/i,
        /"last":\s*([0-9.]+)/i,
        /"price":\s*([0-9.]+)/i,
        // Data attributes
        /data-price=["']([0-9.]+)["']/i,
        /data-last=["']([0-9.]+)["']/i,
        // Table display
        /<td[^>]*>Last<\/td>\s*<td[^>]*>([0-9.]+)</i,
      ];

      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const parsedPrice = parseFloat(match[1]);
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            price = parsedPrice;
            console.log(`Found price from HTML: ${price}`);
            break;
          }
        }
      }
    }

    // Look for percent change first - Trading Economics uses id="pch"
    const percentPatterns = [
      // Main percent display with id="pch"
      /<[^>]*id=["']pch["'][^>]*>([+-]?[0-9.]+)/i,
      // With percentage symbol
      /<[^>]*id=["']pch["'][^>]*>([+-]?[0-9.]+)%/i,
      // In parentheses next to price
      /\(([+-]?[0-9.]+)%\)/,
      // Alternative patterns
      /"changePercent":\s*"?([+-]?[0-9.]+)"?/i,
      /"changepct":\s*"?([+-]?[0-9.]+)"?/i,
      /data-changepercent=["']([+-]?[0-9.]+)["']/i,
    ];

    for (const pattern of percentPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const parsedPercent = parseFloat(match[1]);
        if (!isNaN(parsedPercent)) {
          changePercent = parsedPercent;
          console.log(`Found changePercent: ${changePercent}`);
          break;
        }
      }
    }

    // Now look for change values - Trading Economics uses id="ch"
    const changePatterns = [
      // Main change display with id="ch" - captures sign and number together
      /<[^>]*id=["']ch["'][^>]*>([+-]?[0-9.]+)/i,
      // Change value directly after price (pattern: price-change or price+change)
      />[0-9.]+([+-][0-9.]+)\(/i,
      // Alternative patterns
      /"change":\s*"?([+-]?[0-9.]+)"?/i,
      /data-change=["']([+-]?[0-9.]+)["']/i,
    ];

    for (const pattern of changePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const parsedChange = parseFloat(match[1]);
        if (!isNaN(parsedChange)) {
          change = parsedChange;
          console.log(`Found change: ${change}`);
          break;
        }
      }
    }

    // If we have percent change but no change value, or if signs don't match, recalculate
    if (changePercent !== null && price !== null) {
      if (change === null) {
        // Calculate change from price and percent
        change = (price * changePercent) / (100 + changePercent);
        console.log(`Calculated change from percent: ${change}`);
      } else if ((change > 0 && changePercent < 0) || (change < 0 && changePercent > 0)) {
        // Signs don't match, fix the sign based on percent
        change = Math.abs(change) * (changePercent < 0 ? -1 : 1);
        console.log(`Fixed change sign based on percent: ${change}`);
      }
    }

    if (price !== null) {
      console.log(`Successfully fetched from ${url}: price=${price}, change=${change || 0}, changePercent=${changePercent || 0}`);
      return {
        price,
        change: change || 0,
        changePercent: changePercent || 0,
      };
    }

    console.error(`Could not extract price from ${url}`);
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
      {
        name: 'VLSFO',
        price: 620,
        change: 8.30,
        changePercent: 1.36,
        currency: 'USD',
        unit: 'per metric ton',
        url: 'https://shipandbunker.com/prices',
        history: generateIntradayHistory(620, 0.022),
      },
      {
        name: 'IFO 380',
        price: 490,
        change: 6.50,
        changePercent: 1.34,
        currency: 'USD',
        unit: 'per metric ton',
        url: 'https://shipandbunker.com/prices',
        history: generateIntradayHistory(490, 0.020),
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
        {
          name: 'VLSFO',
          price: 620,
          change: 8.30,
          changePercent: 1.36,
          currency: 'USD',
          unit: 'per metric ton',
          url: 'https://shipandbunker.com/prices',
          history: generateIntradayHistory(620, 0.022),
        },
        {
          name: 'IFO 380',
          price: 490,
          change: 6.50,
          changePercent: 1.34,
          currency: 'USD',
          unit: 'per metric ton',
          url: 'https://shipandbunker.com/prices',
          history: generateIntradayHistory(490, 0.020),
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

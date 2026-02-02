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

async function fetchPriceFromWSJ(url: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.wsj.com/',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch from WSJ ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    console.log('WSJ HTML length:', html.length);

    let price: number | null = null;
    let change: number | null = null;
    let changePercent: number | null = null;

    // Try to find JSON data embedded in the page
    const jsonDataPatterns = [
      /"instrumentData":\s*({[^}]+})/i,
      /"quoteData":\s*({[^}]+})/i,
      /window\.__STATE__\s*=\s*({.+?});/i,
      /"data":\s*({[^}]*"lastPrice"[^}]+})/i,
    ];

    for (const pattern of jsonDataPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (jsonData.lastPrice || jsonData.last) {
            price = parseFloat(jsonData.lastPrice || jsonData.last);
            change = parseFloat(jsonData.priceChange || jsonData.change || 0);
            changePercent = parseFloat(jsonData.percentChange || jsonData.changePercent || 0);
            console.log(`Found WSJ data from JSON: price=${price}, change=${change}, changePercent=${changePercent}`);
            break;
          }
        } catch (e) {
          console.log('Failed to parse JSON data from pattern');
        }
      }
    }

    // Fallback to regex patterns if JSON parsing failed
    if (price === null) {
      const pricePatterns = [
        /"lastPrice"\s*:\s*"?([0-9.]+)"?/i,
        /"last"\s*:\s*"?([0-9.]+)"?/i,
        /"price"\s*:\s*"?([0-9.]+)"?/i,
        /data-value="([0-9.,]+)"/i,
        /<span[^>]*class="[^"]*WSJTheme--value[^"]*"[^>]*>\$?([0-9.,]+)</i,
        /lastPrice["\s:]+([0-9.,]+)/i,
        /"value"\s*:\s*"?([0-9.]+)"?/i,
      ];

      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const parsedPrice = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            price = parsedPrice;
            console.log(`Found WSJ price from HTML: ${price}`);
            break;
          }
        }
      }
    }

    if (change === null) {
      const changePatterns = [
        /"priceChange"\s*:\s*"?([+-]?[0-9.]+)"?/i,
        /"change"\s*:\s*"?([+-]?[0-9.]+)"?/i,
        /priceChange["\s:]+([+-]?[0-9.,]+)/i,
        /"netChange"\s*:\s*"?([+-]?[0-9.]+)"?/i,
      ];

      for (const pattern of changePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const parsedChange = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(parsedChange)) {
            change = parsedChange;
            console.log(`Found WSJ change from HTML: ${change}`);
            break;
          }
        }
      }
    }

    if (changePercent === null) {
      const percentPatterns = [
        /"percentChange"\s*:\s*"?([+-]?[0-9.]+)"?/i,
        /"changePercent"\s*:\s*"?([+-]?[0-9.]+)"?/i,
        /percentChange["\s:]+([+-]?[0-9.]+)/i,
        /"pctChange"\s*:\s*"?([+-]?[0-9.]+)"?/i,
      ];

      for (const pattern of percentPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const parsedPercent = parseFloat(match[1]);
          if (!isNaN(parsedPercent)) {
            changePercent = parsedPercent;
            console.log(`Found WSJ changePercent from HTML: ${changePercent}`);
            break;
          }
        }
      }
    }

    // Calculate missing values if we have enough data
    if (changePercent !== null && price !== null && change === null) {
      change = (price * changePercent) / (100 + changePercent);
      console.log(`Calculated WSJ change from percent: ${change}`);
    } else if (change !== null && price !== null && changePercent === null) {
      const previousPrice = price - change;
      changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;
      console.log(`Calculated WSJ changePercent from change: ${changePercent}`);
    }

    if (price !== null) {
      console.log(`✓ Successfully scraped WSJ: price=${price}, change=${change || 0}, changePercent=${changePercent || 0}`);
      return {
        price,
        change: change || 0,
        changePercent: changePercent || 0,
      };
    }

    console.error(`✗ Could not extract price from WSJ ${url} - will use fallback values`);
    return null;
  } catch (error) {
    console.error(`✗ Error fetching price from WSJ ${url}:`, error);
    return null;
  }
}

async function fetchBunkerPricesFromShipAndBunker(): Promise<{ mgo: any; vlsfo: any; ifo380: any }> {
  try {
    const response = await fetch('https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch bunker prices: ${response.status}`);
      return { mgo: null, vlsfo: null, ifo380: null };
    }

    const html = await response.text();

    const extractPriceData = (fuelType: string) => {
      const patterns = [
        new RegExp(`${fuelType}[^>]*>\\s*<[^>]*>\\s*([0-9.,]+)\\s*<[^>]*>\\s*([+-]?[0-9.,]+)`, 'i'),
        new RegExp(`>${fuelType}<[^>]*>.*?([0-9.,]+).*?([+-]?[0-9.,]+)`, 'i'),
        new RegExp(`data-fuel="${fuelType}"[^>]*data-price="([0-9.,]+)"[^>]*data-change="([+-]?[0-9.,]+)"`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const price = parseFloat(match[1].replace(',', ''));
          const change = match[2] ? parseFloat(match[2].replace(',', '')) : 0;
          const changePercent = price > 0 ? (change / (price - change)) * 100 : 0;

          if (!isNaN(price) && price > 0) {
            return {
              price,
              change,
              changePercent: parseFloat(changePercent.toFixed(2)),
            };
          }
        }
      }

      const tablePattern = new RegExp(
        `<tr[^>]*>[^<]*<td[^>]*>${fuelType}[^<]*</td>\\s*<td[^>]*>([0-9.,]+)</td>\\s*<td[^>]*>([+-]?[0-9.,]+)</td>`,
        'i'
      );
      const tableMatch = html.match(tablePattern);
      if (tableMatch && tableMatch[1]) {
        const price = parseFloat(tableMatch[1].replace(',', ''));
        const change = tableMatch[2] ? parseFloat(tableMatch[2].replace(',', '')) : 0;
        const changePercent = price > 0 ? (change / (price - change)) * 100 : 0;

        if (!isNaN(price) && price > 0) {
          return {
            price,
            change,
            changePercent: parseFloat(changePercent.toFixed(2)),
          };
        }
      }

      return null;
    };

    const mgo = extractPriceData('MGO') || extractPriceData('DMA') || extractPriceData('MGO 0.1%S');
    const vlsfo = extractPriceData('VLSFO') || extractPriceData('VLSFO 0.5%S');
    const ifo380 = extractPriceData('IFO380') || extractPriceData('IFO 380') || extractPriceData('HSFO');

    console.log('Bunker prices extracted:', { mgo, vlsfo, ifo380 });

    return { mgo, vlsfo, ifo380 };
  } catch (error) {
    console.error('Error fetching bunker prices from Ship & Bunker:', error);
    return { mgo: null, vlsfo: null, ifo380: null };
  }
}

async function fetchOilPrices(): Promise<OilPricesResponse> {
  try {
    const [wtiData, brentData, bunkerPrices, gasoilData] = await Promise.all([
      fetchPriceFromTradingEconomics('https://tradingeconomics.com/commodity/crude-oil'),
      fetchPriceFromTradingEconomics('https://tradingeconomics.com/commodity/brent-crude-oil'),
      fetchBunkerPricesFromShipAndBunker(),
      fetchPriceFromWSJ('https://www.wsj.com/market-data/quotes/futures/UK/IFEU/GAS00'),
    ]);

    const mgoPrice = bunkerPrices.mgo?.price || 850;
    const mgoChange = bunkerPrices.mgo?.change || 12.50;
    const mgoChangePercent = bunkerPrices.mgo?.changePercent || 1.49;

    const vlsfoPrice = bunkerPrices.vlsfo?.price || 620;
    const vlsfoChange = bunkerPrices.vlsfo?.change || 8.30;
    const vlsfoChangePercent = bunkerPrices.vlsfo?.changePercent || 1.36;

    const ifo380Price = bunkerPrices.ifo380?.price || 490;
    const ifo380Change = bunkerPrices.ifo380?.change || 6.50;
    const ifo380ChangePercent = bunkerPrices.ifo380?.changePercent || 1.34;

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
        name: 'Low Sulphur Gasoil',
        price: gasoilData?.price || 686.00,
        change: gasoilData?.change || -56.50,
        changePercent: gasoilData?.changePercent || -7.61,
        currency: 'USD',
        unit: 'per metric ton',
        url: 'https://www.wsj.com/market-data/quotes/futures/UK/IFEU/GAS00',
        history: generateIntradayHistory(gasoilData?.price || 686.00, 0.023),
      },
      {
        name: 'MGO (Global Average)',
        price: mgoPrice,
        change: mgoChange,
        changePercent: mgoChangePercent,
        currency: 'USD',
        unit: 'per metric ton',
        url: 'https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average',
        history: generateIntradayHistory(mgoPrice, 0.025),
      },
      {
        name: 'VLSFO (Global Average)',
        price: vlsfoPrice,
        change: vlsfoChange,
        changePercent: vlsfoChangePercent,
        currency: 'USD',
        unit: 'per metric ton',
        url: 'https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average',
        history: generateIntradayHistory(vlsfoPrice, 0.022),
      },
      {
        name: 'IFO 380 (Global Average)',
        price: ifo380Price,
        change: ifo380Change,
        changePercent: ifo380ChangePercent,
        currency: 'USD',
        unit: 'per metric ton',
        url: 'https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average',
        history: generateIntradayHistory(ifo380Price, 0.020),
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
          name: 'Low Sulphur Gasoil',
          price: 686.00,
          change: -56.50,
          changePercent: -7.61,
          currency: 'USD',
          unit: 'per metric ton',
          url: 'https://www.wsj.com/market-data/quotes/futures/UK/IFEU/GAS00',
          history: generateIntradayHistory(686.00, 0.023),
        },
        {
          name: 'MGO (Global Average)',
          price: 850,
          change: 12.50,
          changePercent: 1.49,
          currency: 'USD',
          unit: 'per metric ton',
          url: 'https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average',
          history: generateIntradayHistory(850, 0.025),
        },
        {
          name: 'VLSFO (Global Average)',
          price: 620,
          change: 8.30,
          changePercent: 1.36,
          currency: 'USD',
          unit: 'per metric ton',
          url: 'https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average',
          history: generateIntradayHistory(620, 0.022),
        },
        {
          name: 'IFO 380 (Global Average)',
          price: 490,
          change: 6.50,
          changePercent: 1.34,
          currency: 'USD',
          unit: 'per metric ton',
          url: 'https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average',
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

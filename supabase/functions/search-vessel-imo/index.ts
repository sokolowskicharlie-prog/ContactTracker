import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VesselSearchRequest {
  vesselName: string;
}

interface VesselSearchResponse {
  imo?: string;
  mmsi?: string;
  vesselName?: string;
  error?: string;
}

async function searchVesselIMO(vesselName: string): Promise<VesselSearchResponse> {
  try {
    const searchUrl = `https://www.marinetraffic.com/en/ais/index/search/all?keyword=${encodeURIComponent(vesselName)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Marine Traffic search failed: ${response.status}`);
    }

    const html = await response.text();

    const imoMatch = html.match(/IMO[:\s]+(\d{7})/i);
    const mmsiMatch = html.match(/MMSI[:\s]+(\d{9})/i);
    const nameMatch = html.match(/<title>([^<]+)\s*[-|]/i);

    if (imoMatch) {
      return {
        imo: imoMatch[1],
        mmsi: mmsiMatch ? mmsiMatch[1] : undefined,
        vesselName: nameMatch ? nameMatch[1].trim() : vesselName,
      };
    }

    return {
      error: 'No IMO number found for this vessel name',
    };
  } catch (error) {
    console.error('Error searching vessel:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to search vessel',
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
    if (req.method !== "POST") {
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

    const { vesselName }: VesselSearchRequest = await req.json();

    if (!vesselName) {
      return new Response(
        JSON.stringify({ error: "Vessel name is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await searchVesselIMO(vesselName);

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
    console.error("Error in search-vessel-imo function:", error);
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

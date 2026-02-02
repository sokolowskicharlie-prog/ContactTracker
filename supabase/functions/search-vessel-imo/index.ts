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
    const searchQuery = `${vesselName} IMO`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Google search failed: ${response.status}`);
    }

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1];
      const titleImoMatch = title.match(/\(IMO\s*(\d{7})\)/i);
      if (titleImoMatch) {
        return {
          imo: titleImoMatch[1],
          vesselName,
        };
      }
    }

    const h3Patterns = [
      /<h3[^>]*>([^<]*\(IMO\s*(\d{7})\)[^<]*)<\/h3>/gi,
      /<div[^>]*class="[^"]*BNeawe[^"]*"[^>]*>([^<]*\(IMO\s*(\d{7})\)[^<]*)<\/div>/gi,
    ];

    for (const pattern of h3Patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const imo = match[2];
        if (imo && imo.length === 7 && /^\d{7}$/.test(imo)) {
          return {
            imo,
            vesselName,
          };
        }
      }
    }

    const imoPatterns = [
      /IMO\s*[:\-]?\s*(\d{7})/i,
      /\(IMO\s*(\d{7})\)/i,
      /IMO\s+number\s*[:\-]?\s*(\d{7})/i,
    ];

    for (const pattern of imoPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const imo = match[1];
        if (imo.length === 7 && /^\d{7}$/.test(imo)) {
          return {
            imo,
            vesselName,
          };
        }
      }
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

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,apikey,x-client-info,content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { reportId } = await req.json();
    
    if (!reportId) {
      return new Response(JSON.stringify({ error: "Missing reportId" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try multiple possible paths for the preview/final PDF
    const candidates = [
      `previews/${reportId}-preview2.pdf`,
      `previews/${reportId}-preview.pdf`,
      `previews/${reportId}.pdf`,
      `reports/${reportId}.pdf`,
    ];

    for (const path of candidates) {
      const { data, error } = await supabase.storage
        .from("business-plans")
        .createSignedUrl(path, 300);

      if (data?.signedUrl) {
        console.log(`Found preview at: ${path}`);
        return new Response(
          JSON.stringify({ previewUrl: data.signedUrl, path }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      } else if (error) {
        console.log(`Path not available yet: ${path} - ${error.message}`);
      }
    }

    // If none of the candidates exist yet, indicate that it's still preparing
    return new Response(JSON.stringify({ status: "preparing" }), {
      status: 202,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-preview-pdf:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});

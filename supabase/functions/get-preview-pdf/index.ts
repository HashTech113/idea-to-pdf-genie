import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Allow preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "authorization,apikey,x-client-info,content-type",
      },
    });
  }

  // Validate request
  const url = new URL(req.url);
  const reportId = url.searchParams.get("reportId");
  if (!reportId)
    return new Response(JSON.stringify({ error: "Missing reportId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  // Initialize Supabase client with Service Role key
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Create a signed URL for the 2-page preview
  const path = `previews/${reportId}-preview2.pdf`;
  const { data, error } = await supabase.storage
    .from("business-plans")
    .createSignedUrl(path, 300); // expires in 5 mins

  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  return new Response(JSON.stringify({ previewUrl: data.signedUrl }), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
});

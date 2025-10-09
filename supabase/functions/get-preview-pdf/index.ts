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

  const url = new URL(req.url);
  const reportId = url.searchParams.get("reportId");
  if (!reportId)
    return new Response(JSON.stringify({ error: "Missing reportId" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check if the preview exists
  const path = `previews/${reportId}-preview2.pdf`;
  const { data: list } = await supabase.storage
    .from("business-plans")
    .list("previews", { search: `${reportId}-preview2.pdf`, limit: 1 });

  if (!list?.length)
    return new Response(JSON.stringify({ status: "preparing" }), {
      status: 202,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  // Return signed URL
  const { data, error } = await supabase.storage
    .from("business-plans")
    .createSignedUrl(path, 300);

  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  return new Response(JSON.stringify({ previewUrl: data.signedUrl }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

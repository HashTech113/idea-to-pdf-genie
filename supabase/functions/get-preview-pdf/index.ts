import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "business-plans";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const reportId = url.searchParams.get("reportId");
    const exp = Number(url.searchParams.get("exp") ?? 300);

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "missing_reportId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating signed URL for preview: ${reportId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if preview exists
    const previewPath = `previews/${reportId}-preview2.pdf`;
    const { data: list, error: listError } = await supabase.storage
      .from(BUCKET)
      .list("previews", { search: `${reportId}-preview2.pdf`, limit: 1 });

    if (listError) {
      console.error("Error listing files:", listError);
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!list?.find(f => f.name === `${reportId}-preview2.pdf`)) {
      console.log("Preview not found");
      return new Response(
        JSON.stringify({ error: "preview_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(previewPath, exp);

    if (signError) {
      console.error("Error creating signed URL:", signError);
      return new Response(
        JSON.stringify({ error: signError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Signed URL generated successfully");
    return new Response(
      JSON.stringify({ previewUrl: signedData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

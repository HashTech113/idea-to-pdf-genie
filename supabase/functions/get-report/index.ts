import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOW_ORIGIN = "https://idea-to-pdf-genie.lovable.app";
const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Vary": "Origin",
};

const BUCKET = "business-plans";
const SIGN_TTL = 600; // 10 minutes

function withDownloadParam(signedUrl: string, fileName: string) {
  const sep = signedUrl.includes("?") ? "&" : "?";
  return `${signedUrl}${sep}download=${encodeURIComponent(fileName)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = new URL(req.url);
    const reportId = url.searchParams.get("reportId");
    if (!reportId) return new Response(JSON.stringify({ error: "Missing reportId" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) {
      console.error("Auth error:", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profErr) {
      console.error("Profile error:", profErr);
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 403, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const isFree = !profile?.plan || profile.plan === "free";

    const fullKey = `private/${user.id}/${reportId}.pdf`;
    const previewKey = `previews/${reportId}-preview2.pdf`;

    async function sign(key: string) {
      const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(key, SIGN_TTL);
      if (error || !data?.signedUrl) {
        console.error(`Signing failed for ${key}:`, error);
        throw new Error(`Signing failed for ${key}: ${error?.message ?? ""}`);
      }
      return data.signedUrl;
    }

    // Paid -> full file URL + downloadUrl
    if (!isFree) {
      const viewUrl = await sign(fullKey);
      const downloadUrl = withDownloadParam(viewUrl, "business-plan.pdf");
      return new Response(JSON.stringify({ type: "full", url: viewUrl, downloadUrl }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // Free -> preview (create if missing)
    const list = await admin.storage.from(BUCKET).list("previews", { search: `${reportId}-preview2.pdf`, limit: 1 });
    if (!list.error && (list.data?.length ?? 0) > 0) {
      const viewUrl = await sign(previewKey);
      const downloadUrl = withDownloadParam(viewUrl, "business-plan-preview.pdf");
      return new Response(JSON.stringify({ type: "preview", url: viewUrl, downloadUrl }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // Create preview from full
    console.log("Creating preview from full PDF...");
    const full = await admin.storage.from(BUCKET).download(fullKey);
    if (full.error || !full.data) {
      console.error("Full PDF not found:", full.error);
      return new Response(JSON.stringify({ error: "Report not found" }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const bytes = await full.data.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes);
    const pageCount = Math.min(2, srcDoc.getPageCount());

    const outDoc = await PDFDocument.create();
    const pages = await outDoc.copyPages(srcDoc, [...Array(pageCount).keys()]);
    pages.forEach((p) => outDoc.addPage(p));
    const previewBytes = await outDoc.save();

    const up = await admin.storage
      .from(BUCKET)
      .upload(previewKey, new Blob([previewBytes], { type: "application/pdf" }), {
        upsert: true,
        contentType: "application/pdf",
      });
    
    if (up.error) {
      console.error("Preview upload error:", up.error);
      return new Response(JSON.stringify({ error: "Failed to create preview" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    console.log("Preview created successfully");
    const viewUrl = await sign(previewKey);
    const downloadUrl = withDownloadParam(viewUrl, "business-plan-preview.pdf");
    return new Response(JSON.stringify({ type: "preview", url: viewUrl, downloadUrl }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (e) {
    console.error("Server error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});

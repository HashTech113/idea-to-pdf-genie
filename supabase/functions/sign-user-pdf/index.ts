import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "business-plans";
const ALLOW = ["http://localhost:5173", "https://idea-to-pdf-genie.lovable.app"];

function allowOrigin(origin: string) {
  try {
    const host = new URL(origin).host;
    if (ALLOW.includes(origin) || host.endsWith(".vercel.app") || host.endsWith(".lovableproject.com")) return origin;
  } catch {}
  return ALLOW[0];
}

function cors(req: Request, extra: HeadersInit = {}) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowOrigin(origin),
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    ...extra,
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors(req, { "Content-Type":"application/json" }) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST")   return json(req, { error: "method_not_allowed" }, 405);

  try {
    const { reportId, exp = 300, isPreview = false } = await req.json().catch(() => ({}));
    if (!reportId) return json(req, { error: "missing_reportId" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SVC  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: get user from JWT
    const auth = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return json(req, { error: "unauthorized" }, 401);

    const svc = createClient(SUPABASE_URL, SVC);
    const fileName = isPreview ? `${reportId}-preview2.pdf` : `${reportId}.pdf`;
    const path = `private/${user.id}/${fileName}`;

    console.log('Signing PDF for user:', user.id, 'reportId:', reportId, 'isPreview:', isPreview, 'path:', path);

    // Confirm file exists
    const dir = `private/${user.id}`;
    const { data: list, error: listError } = await svc.storage.from(BUCKET).list(dir, { search: fileName, limit: 1 });
    
    if (listError) {
      console.error('Error listing files:', listError);
      return json(req, { error: listError.message }, 500);
    }
    
    if (!list?.find(o => o.name === fileName)) {
      console.error('File not found:', path);
      return json(req, { error: "not_found" }, 404);
    }

    // View URL (no forced download)
    const view = await svc.storage.from(BUCKET).createSignedUrl(path, Number(exp));
    if (view.error) {
      console.error('Error creating view URL:', view.error);
      return json(req, { error: view.error.message }, 500);
    }

    // Download URL (forces filename) - only for full PDF, not preview
    let downloadUrl = null;
    if (!isPreview) {
      const dl = await svc.storage.from(BUCKET).createSignedUrl(path, Number(exp), { download: fileName });
      if (dl.error) {
        console.error('Error creating download URL:', dl.error);
        return json(req, { error: dl.error.message }, 500);
      }
      downloadUrl = dl.data.signedUrl;
    }

    console.log('Successfully signed URLs for reportId:', reportId, 'isPreview:', isPreview);
    return json(req, { url: view.data.signedUrl, downloadUrl }, 200);
  } catch (e: any) {
    console.error('Error in sign-user-pdf:', e);
    return json(req, { error: String(e?.message ?? e) }, 500);
  }
});

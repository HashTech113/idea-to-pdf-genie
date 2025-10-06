import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOW = ["https://idea-to-pdf-genie.lovable.app", "http://localhost:5173"];

function cors(req: Request, extra: HeadersInit = {}) {
  const origin = req.headers.get("origin") ?? "";
  const host = origin ? new URL(origin).host : "";
  const allow = ALLOW.includes(origin) || /\.lovableproject\.com$/.test(host) ? origin : ALLOW[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    ...extra,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { ok: false, code: "method_not_allowed" }, 405);

  try {
    // env checks (avoid crashing)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !N8N_WEBHOOK_URL) {
      console.error("Missing environment variables:", { 
        hasUrl: !!SUPABASE_URL, 
        hasKey: !!SUPABASE_ANON_KEY, 
        hasWebhook: !!N8N_WEBHOOK_URL 
      });
      return json(req, { ok: false, code: "env_missing" }, 500);
    }

    // auth from JWT
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      console.error("Authentication failed: no user found");
      return json(req, { ok: false, code: "unauthorized" }, 401);
    }

    console.log("Authenticated user:", user.id);

    // parse body
    let body: any;
    try { 
      body = await req.json(); 
    } catch (e) { 
      console.error("Failed to parse JSON body:", e);
      return json(req, { ok: false, code: "bad_json" }, 400); 
    }
    
    const { reportId, formData } = body || {};
    if (!reportId) {
      console.error("Missing reportId in request body");
      return json(req, { ok: false, code: "missing_reportId" }, 400);
    }

    console.log("Starting PDF generation for user:", user.id, "reportId:", reportId);

    // call n8n with timeout (don't hang & crash)
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 28000);
    
    let n8n;
    try {
      n8n = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, reportId, formData }),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(t);
      console.error("n8n fetch error:", e);
      return json(req, { ok: false, code: "n8n_timeout", error: String(e) }, 502);
    } finally {
      clearTimeout(t);
    }

    const text = await n8n.text();
    console.log("n8n response status:", n8n.status, "body:", text.substring(0, 200));
    
    if (!n8n.ok) {
      console.error("n8n webhook error:", n8n.status, text);
      return json(req, { 
        ok: false, 
        code: "n8n_error", 
        status: n8n.status, 
        details: safeJson(text) 
      }, 502);
    }

    console.log("PDF generation job started successfully");
    return json(req, { ok: true, started: true, n8n: safeJson(text) }, 202);
    
  } catch (e) {
    console.error("Unhandled error in generate-business-plan function:", e);
    return json(req, { ok: false, code: "unhandled", error: String(e?.message ?? e) }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: cors(req, { "Content-Type": "application/json" }) 
  });
}

function safeJson(s: string) { 
  try { 
    return JSON.parse(s); 
  } catch { 
    return { raw: s }; 
  } 
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get auth header and verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody = await req.json();
    const { userId, reportId, ...formData } = requestBody;

    console.log("Starting PDF generation for user:", userId, "reportId:", reportId);

    // Trigger n8n webhook as a fire-and-forget background task
    // n8n will call back to update-pdf-status when done
    const webhookTask = async () => {
      try {
        const n8nUrl = "https://hashirceo.app.n8n.cloud/webhook-test/generate-pdf";

        console.log("Calling n8n webhook for reportId:", reportId);
        console.log("Webhook payload:", { userId, reportId, formDataKeys: Object.keys(formData) });

        // Include callback URL for n8n to call when done
        const callbackUrl = `${supabaseUrl}/functions/v1/update-pdf-status`;

        const response = await fetch(n8nUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            reportId,
            formData,
            callbackUrl,
            supabaseUrl: supabaseUrl,
            supabaseKey: supabaseKey,
          }),
          signal: AbortSignal.timeout(10000), // 10 second timeout just to trigger the webhook
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("n8n webhook trigger failed:", response.status, errorText);
        } else {
          console.log("n8n webhook triggered successfully for reportId:", reportId);
          console.log("Waiting for n8n to call back with PDF URL...");
        }
      } catch (error) {
        console.error("Error triggering n8n webhook:", error);
        console.error("Error details:", error.message || "Unknown error");
      }
    };

    // Use EdgeRuntime.waitUntil to keep the function alive for the background task
    EdgeRuntime.waitUntil(webhookTask());

    console.log("PDF generation triggered for reportId:", reportId);

    return new Response(
      JSON.stringify({
        status: "processing",
        message: "PDF generation started.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in generate-business-plan function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

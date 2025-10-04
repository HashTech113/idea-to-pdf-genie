import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const requestBody = await req.json();
    
    // Extract auth token
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) {
      console.error("Auth error:", userErr);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log('Proxying request to n8n webhook:', requestBody);

    const response = await fetch('https://hashirceo.app.n8n.cloud/webhook/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('n8n webhook error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate Business Plan' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the PDF blob from the response
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const pdfSize = arrayBuffer.byteLength;

    console.log('Received PDF from n8n, size:', pdfSize);

    // Validate PDF size
    if (pdfSize === 0) {
      console.error('n8n returned empty PDF');
      return new Response(
        JSON.stringify({ error: 'Generated PDF is empty' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reportId and upload to storage
    const reportId = `report-${Date.now()}`;
    const filePath = `private/${user.id}/${reportId}.pdf`;

    const uploadResult = await admin.storage
      .from('business-plans')
      .upload(filePath, new Blob([arrayBuffer], { type: 'application/pdf' }), {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadResult.error) {
      console.error('Storage upload error:', uploadResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to save PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PDF uploaded successfully:', filePath);

    return new Response(
      JSON.stringify({ reportId }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-business-plan function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
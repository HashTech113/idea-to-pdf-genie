import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const requestBody = await req.json();
    
    console.log('Proxying request to n8n webhook:', requestBody);

    // 10s timeout for n8n webhook
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://hashirceo.app.n8n.cloud/webhook-test/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('n8n webhook error:', response.status, response.statusText, errorText);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Failed to generate Business Plan: ${response.status} ${response.statusText}`,
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the PDF blob from the response
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    console.log('Successfully generated PDF, size:', arrayBuffer.byteLength);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Build a unique file path
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const safeName = (requestBody.businessName || 'business')
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const fileName = `${safeName}-${now.getTime()}.pdf`;
    const path = `business-plans/${yyyy}/${mm}/${dd}/${fileName}`;

    // Upload to Storage
    const { error: uploadError } = await supabase
      .storage
      .from('business-plans')
      .upload(path, blob, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to save PDF to storage', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('business-plans')
      .getPublicUrl(path);
    
    const pdfUrl = publicUrlData?.publicUrl ?? null;

    // Insert database record
    const { error: dbError } = await supabase
      .from('business_plans')
      .insert({
        business_name: requestBody.businessName || 'Untitled Business',
        form_data: requestBody,
        pdf_path: path,
        pdf_url: pdfUrl,
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to save plan record', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully saved PDF and record:', { path, pdfUrl });

    // Return the PDF for download
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=business-plan.pdf',
      },
    });

  } catch (error) {
    console.error('Error in generate-business-plan function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
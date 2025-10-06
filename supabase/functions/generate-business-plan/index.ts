import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://idea-to-pdf-genie.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const { userId, reportId, ...formData } = requestBody;
    
    console.log('Starting PDF generation for user:', userId, 'reportId:', reportId);

    // Call n8n webhook to generate PDF
    const n8nResponse = await fetch('https://hashirceo.app.n8n.cloud/webhook/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, reportId, ...formData }),
    });

    if (!n8nResponse.ok) {
      console.error('n8n webhook error:', n8nResponse.status, n8nResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate Business Plan' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the PDF blob from n8n response
    const pdfBlob = await n8nResponse.blob();
    const pdfBuffer = await pdfBlob.arrayBuffer();

    console.log('PDF generated, size:', pdfBuffer.byteLength);

    // Upload full PDF to Supabase Storage
    const fullPdfPath = `private/${userId}/${reportId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('business-plans')
      .upload(fullPdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to store PDF' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('PDF stored successfully at:', fullPdfPath);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId,
        message: 'Business plan generated and stored successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
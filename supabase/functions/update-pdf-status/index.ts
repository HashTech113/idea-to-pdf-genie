import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody = await req.json();
    const { reportId, pdfUrl, previewPdfUrl, fullPdfUrl, error: n8nError } = requestBody;
    
    console.log('Received callback from n8n for reportId:', reportId);
    console.log('Payload:', JSON.stringify(requestBody, null, 2));

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'reportId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If n8n reported an error
    if (n8nError) {
      console.error('n8n reported error:', n8nError);
      
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          status: 'failed',
          error_message: `n8n workflow error: ${n8nError}`
        })
        .eq('report_id', reportId);

      if (updateError) {
        console.error('Error updating job status:', updateError);
      }

      return new Response(
        JSON.stringify({ success: false, error: n8nError }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract PDF URLs - support multiple field names
    const extractedPdfUrl = pdfUrl || 
                           previewPdfUrl || 
                           fullPdfUrl;

    if (!extractedPdfUrl) {
      console.error('No PDF URL provided in callback');
      
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          status: 'failed',
          error_message: 'No PDF URL received from n8n workflow'
        })
        .eq('report_id', reportId);

      if (updateError) {
        console.error('Error updating job status:', updateError);
      }

      return new Response(
        JSON.stringify({ error: 'No PDF URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating job with PDF URL:', extractedPdfUrl);

    // Update job with PDF URLs
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: 'completed',
        preview_pdf_path: previewPdfUrl || extractedPdfUrl,
        full_pdf_path: fullPdfUrl || extractedPdfUrl,
        completed_at: new Date().toISOString()
      })
      .eq('report_id', reportId);

    if (updateError) {
      console.error('Error updating job:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update job status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Job successfully updated for reportId:', reportId);

    return new Response(
      JSON.stringify({ 
        success: true,
        reportId,
        message: 'PDF status updated successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in update-pdf-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

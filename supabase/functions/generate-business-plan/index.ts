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

    // Update job status to 'processing'
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'processing' })
      .eq('report_id', reportId);

    if (updateError) {
      console.error('Error updating job status:', updateError);
    }

    // Trigger n8n webhook as a background task
    const webhookTask = async () => {
      try {
        const n8nUrl = 'https://hashirceo.app.n8n.cloud/webhook/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f';
        
        console.log('Calling n8n webhook for reportId:', reportId);
        
        const response = await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId, 
            reportId, 
            formData,
            supabaseUrl: supabaseUrl,
            supabaseKey: supabaseKey 
          }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('n8n webhook failed:', response.status, errorText);
          
          // Update job status to failed
          await supabase
            .from('jobs')
            .update({ 
              status: 'failed',
              error_message: `Webhook failed: ${response.status} ${errorText}`
            })
            .eq('report_id', reportId);
        } else {
          console.log('n8n webhook succeeded for reportId:', reportId);
        }
      } catch (error) {
        console.error('Error calling n8n webhook:', error);
        
        // Update job status to failed
        await supabase
          .from('jobs')
          .update({ 
            status: 'failed',
            error_message: error.message || 'Webhook call failed'
          })
          .eq('report_id', reportId);
      }
    };

    // Use EdgeRuntime.waitUntil to keep the function alive for the background task
    EdgeRuntime.waitUntil(webhookTask());

    console.log('PDF generation triggered for reportId:', reportId);

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
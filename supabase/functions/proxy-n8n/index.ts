import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL is not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the request body
    const body = await req.json();
    console.log('Forwarding request to n8n:', body);

    // Forward the request to n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response from n8n
    const contentType = response.headers.get('content-type');
    console.log('Response status from n8n:', response.status);
    console.log('Response content-type:', contentType);

    // Check if response is JSON
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      console.log('Response from n8n:', responseData);

      return new Response(
        JSON.stringify(responseData),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Handle non-JSON response (likely an error)
      const responseText = await response.text();
      console.error('Non-JSON response from n8n:', responseText.substring(0, 500));

      return new Response(
        JSON.stringify({ 
          error: 'n8n webhook returned non-JSON response',
          status: response.status,
          details: responseText.substring(0, 200)
        }),
        {
          status: response.ok ? 200 : response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in proxy-n8n function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to forward request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

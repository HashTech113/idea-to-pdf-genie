import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const requestBody = await req.json();
    
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

    console.log('Successfully generated PDF, size:', arrayBuffer.byteLength);

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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
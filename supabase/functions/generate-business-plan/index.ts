import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const formData = await req.json();
    console.log('Received form data for user:', user.id);

    // Map delivery method values to database format
    const deliveryMethodMap: Record<string, string> = {
      'physical-store': 'physical',
      'online': 'online', 
      'hybrid': 'both',
      'direct-sales': 'field_service'
    };

    // Save business data to Supabase
    const businessData = {
      user_id: user.id,
      business_name: formData.businessName,
      business_desc: formData.businessDescription,
      employee_count: parseInt(formData.numberOfEmployees) || 0,
      customer_region: formData.customerLocation,
      offer_type: formData.offeringType,
      delivery_method: deliveryMethodMap[formData.deliveryMethod] || formData.deliveryMethod,
    };

    // Upsert the business data (update if exists, insert if not)
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert(businessData, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save business data' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Successfully saved business data to Supabase');

    // Prepare data for n8n webhook (include user_id)
    const webhookData = {
      ...formData,
      user_id: user.id
    };

    console.log('Proxying request to n8n webhook with user_id:', user.id);

    const response = await fetch('https://hashirceo.app.n8n.cloud/webhook/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
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

    console.log('Successfully generated PDF and saved business data, size:', arrayBuffer.byteLength);

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
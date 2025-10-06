import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query params
    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId');
    const exp = parseInt(url.searchParams.get('exp') || '300');

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'Missing reportId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user plan from profiles
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';

    // Create admin client for signing URLs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Sign preview URL (always for 2-page preview)
    const previewPath = `previews/${reportId}-preview2.pdf`;
    const { data: previewData, error: previewError } = await supabaseAdmin
      .storage
      .from('business-plans')
      .createSignedUrl(previewPath, exp);

    if (previewError || !previewData) {
      console.error('Preview not found:', previewError);
      return new Response(
        JSON.stringify({ error: 'preview_not_ready' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let downloadUrl = null;
    let type = 'preview';

    // Sign download URL only for Pro users
    if (userPlan === 'pro') {
      type = 'full';
      const fullPath = `private/${user.id}/${reportId}.pdf`;
      const { data: downloadData } = await supabaseAdmin
        .storage
        .from('business-plans')
        .createSignedUrl(fullPath, exp, {
          download: `business-plan-${reportId}.pdf`,
        });

      downloadUrl = downloadData?.signedUrl || null;
    }

    return new Response(
      JSON.stringify({
        type,
        previewUrl: previewData.signedUrl,
        downloadUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sign-report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

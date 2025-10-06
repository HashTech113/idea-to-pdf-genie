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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get reportId from request body
    const { reportId } = await req.json();

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'reportId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's plan from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPlan = profile?.plan || 'free';
    const expiresIn = 600; // 10 minutes

    if (userPlan === 'free') {
      // Check if 2-page preview exists
      const previewPath = `previews/${reportId}-preview2.pdf`;
      
      const { data: previewExists } = await supabase.storage
        .from('business-plans')
        .list('previews', {
          search: `${reportId}-preview2.pdf`
        });

      if (!previewExists || previewExists.length === 0) {
        // Preview not ready yet
        return new Response(
          JSON.stringify({ error: 'preview_not_ready' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate signed URL for preview (view only, no download)
      const { data: signedData, error: signError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(previewPath, expiresIn);

      if (signError || !signedData) {
        console.error('Error creating signed URL:', signError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate preview URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          type: 'preview', 
          url: signedData.signedUrl,
          downloadUrl: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Pro user - return full PDF
      const fullPath = `private/${user.id}/${reportId}.pdf`;

      // Check if full PDF exists
      const { data: fullExists } = await supabase.storage
        .from('business-plans')
        .list(`private/${user.id}`, {
          search: `${reportId}.pdf`
        });

      if (!fullExists || fullExists.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Report not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate signed URL for viewing (no download)
      const { data: viewData, error: viewError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPath, expiresIn);

      // Generate signed URL for downloading
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPath, expiresIn, {
          download: true
        });

      if (viewError || !viewData) {
        console.error('Error creating view URL:', viewError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate preview URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          type: 'full', 
          url: viewData.signedUrl,
          downloadUrl: downloadData?.signedUrl || null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in get-report function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

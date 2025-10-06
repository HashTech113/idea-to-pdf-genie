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

    // Get auth header and verify user
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

    // Get reportId and optional expiry from request body
    const { reportId, exp } = await req.json();
    
    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'reportId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiresIn = exp || 300; // Default 5 minutes
    console.log(`Signing URLs for reportId: ${reportId}, userId: ${user.id}, expiresIn: ${expiresIn}s`);

    // Check if 2-page preview exists
    const previewPath = `previews/${reportId}-preview2.pdf`;
    const { data: previewExists } = await supabase.storage
      .from('business-plans')
      .list('previews', {
        search: `${reportId}-preview2.pdf`
      });

    if (!previewExists || previewExists.length === 0) {
      console.log('Preview not ready yet');
      return new Response(
        JSON.stringify({ error: 'preview_not_ready' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL for preview (view-only, no download)
    const { data: previewData, error: previewError } = await supabase.storage
      .from('business-plans')
      .createSignedUrl(previewPath, expiresIn);

    if (previewError || !previewData) {
      console.error('Error creating preview URL:', previewError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate preview URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL for download (full PDF with download disposition)
    const fullPath = `private/${user.id}/${reportId}.pdf`;
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('business-plans')
      .createSignedUrl(fullPath, expiresIn, {
        download: true
      });

    if (downloadError || !downloadData) {
      console.error('Error creating download URL:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated signed URLs');
    return new Response(
      JSON.stringify({ 
        previewUrl: previewData.signedUrl,
        downloadUrl: downloadData.signedUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sign-report function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

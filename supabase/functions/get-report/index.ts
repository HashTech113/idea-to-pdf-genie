import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://idea-to-pdf-genie.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get reportId from query params
    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId');
    
    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'Missing reportId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for storage access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPlan = profile?.plan || 'free';
    console.log('User plan:', userPlan, 'for user:', user.id);

    const fullPdfPath = `private/${user.id}/${reportId}.pdf`;
    const previewPath = `previews/${reportId}-preview2.pdf`;

    if (userPlan === 'free') {
      console.log('Free user - checking for preview at:', previewPath);
      
      // Check if preview exists
      const { data: previewExists } = await supabase.storage
        .from('business-plans')
        .list('previews', {
          search: `${reportId}-preview2.pdf`,
        });

      if (!previewExists || previewExists.length === 0) {
        console.log('Preview not found, generating from full PDF');
        
        // Download full PDF
        const { data: fullPdfData, error: downloadError } = await supabase.storage
          .from('business-plans')
          .download(fullPdfPath);

        if (downloadError) {
          console.error('Failed to download full PDF:', downloadError);
          return new Response(
            JSON.stringify({ error: 'Report not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate 2-page preview
        const pdfBytes = await fullPdfData.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const previewDoc = await PDFDocument.create();
        
        const pageCount = Math.min(2, pdfDoc.getPageCount());
        for (let i = 0; i < pageCount; i++) {
          const [copiedPage] = await previewDoc.copyPages(pdfDoc, [i]);
          previewDoc.addPage(copiedPage);
        }

        const previewBytes = await previewDoc.save();

        // Upload preview to storage
        const { error: uploadError } = await supabase.storage
          .from('business-plans')
          .upload(previewPath, previewBytes, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error('Failed to upload preview:', uploadError);
        } else {
          console.log('Preview generated and cached at:', previewPath);
        }
      }

      // Generate signed URL for preview (10 minutes)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(previewPath, 600);

      if (signedUrlError) {
        console.error('Failed to create signed URL:', signedUrlError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate preview URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Returning preview URL for free user');
      return new Response(
        JSON.stringify({
          type: 'preview',
          url: signedUrlData.signedUrl,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Pro user - return full PDF signed URL
      console.log('Pro user - generating signed URL for full PDF at:', fullPdfPath);
      
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPdfPath, 600);

      if (signedUrlError) {
        console.error('Failed to create signed URL:', signedUrlError);
        return new Response(
          JSON.stringify({ error: 'Report not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Returning full PDF URL for pro user');
      return new Response(
        JSON.stringify({
          type: 'full',
          url: signedUrlData.signedUrl,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Error in get-report function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

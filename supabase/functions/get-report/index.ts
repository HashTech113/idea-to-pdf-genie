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
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPlan = profile?.plan || 'free';
    
    if (userPlan === 'free') {
      // Generate preview (2 pages only)
      const previewPath = `previews/${reportId}-preview2.pdf`;
      
      // Check if preview already exists
      const { data: existingPreview } = await supabase.storage
        .from('business-plans')
        .list('previews', {
          search: `${reportId}-preview2.pdf`
        });

      if (!existingPreview || existingPreview.length === 0) {
        // Generate preview from full PDF
        const fullPath = `private/${user.id}/${reportId}.pdf`;
        const { data: fullPdfData, error: downloadError } = await supabase.storage
          .from('business-plans')
          .download(fullPath);

        if (downloadError) {
          console.error('Error downloading full PDF:', downloadError);
          return new Response(
            JSON.stringify({ error: 'Failed to access business plan' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Use pdf-lib to extract first 2 pages
        const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
        const pdfBytes = await fullPdfData.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const previewDoc = await PDFDocument.create();
        
        const pagesToCopy = Math.min(2, pdfDoc.getPageCount());
        const copiedPages = await previewDoc.copyPages(pdfDoc, Array.from({ length: pagesToCopy }, (_, i) => i));
        copiedPages.forEach(page => previewDoc.addPage(page));

        const previewBytes = await previewDoc.save();

        // Upload preview
        const { error: uploadError } = await supabase.storage
          .from('business-plans')
          .upload(previewPath, previewBytes, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading preview:', uploadError);
        }
      }

      // Generate signed URL for preview
      const { data: previewUrlData, error: previewUrlError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(previewPath, 600); // 10 minutes

      if (previewUrlError) {
        console.error('Error creating preview signed URL:', previewUrlError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate preview URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          type: 'preview', 
          url: previewUrlData.signedUrl,
          downloadUrl: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Return signed URL for full PDF
      const fullPath = `private/${user.id}/${reportId}.pdf`;
      
      const { data: urlData, error: urlError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPath, 600); // 10 minutes

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate download URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also create a download URL with proper headers
      const { data: downloadUrlData } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPath, 600);

      return new Response(
        JSON.stringify({ 
          type: 'full', 
          url: urlData.signedUrl,
          downloadUrl: downloadUrlData?.signedUrl || urlData.signedUrl
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

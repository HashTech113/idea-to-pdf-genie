import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dynamic import for pdf-lib
const loadPdfLib = async () => {
  const module = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
  return module;
};

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
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPlan = (profile && 'plan' in profile) ? profile.plan : 'free';
    const fullPdfPath = `private/${user.id}/${reportId}.pdf`;
    const previewPdfPath = `previews/${reportId}-preview2.pdf`;

    console.log('User plan:', userPlan, 'Report ID:', reportId);

    if (userPlan === 'free') {
      // Check if preview already exists
      const { data: existingPreview } = await supabase.storage
        .from('business-plans')
        .list('previews', {
          search: `${reportId}-preview2.pdf`
        });

      // If preview doesn't exist, create it
      if (!existingPreview || existingPreview.length === 0) {
        console.log('Creating 2-page preview...');
        
        // Download the full PDF
        const { data: fullPdfData, error: downloadError } = await supabase.storage
          .from('business-plans')
          .download(fullPdfPath);

        if (downloadError) {
          console.error('Download error:', downloadError);
          throw new Error(`Failed to download full PDF: ${downloadError.message}`);
        }

        // Load pdf-lib
        const { PDFDocument } = await loadPdfLib();

        // Load the PDF and extract first 2 pages
        const arrayBuffer = await fullPdfData.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Create new PDF with only first 2 pages
        const previewDoc = await PDFDocument.create();
        const pagesToCopy = Math.min(2, pdfDoc.getPageCount());
        const pages = await previewDoc.copyPages(pdfDoc, Array.from({ length: pagesToCopy }, (_, i) => i));
        
        pages.forEach((page: any) => previewDoc.addPage(page));
        
        // Save the preview PDF
        const previewPdfBytes = await previewDoc.save();
        
        // Upload preview to storage
        const { error: uploadError } = await supabase.storage
          .from('business-plans')
          .upload(previewPdfPath, previewPdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error('Preview upload error:', uploadError);
          throw new Error(`Failed to upload preview: ${uploadError.message}`);
        }

        console.log('Preview created successfully');
      }

      // Return signed URL for preview
      const { data: previewUrl } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(previewPdfPath, 600);

      return new Response(
        JSON.stringify({ 
          type: 'preview',
          url: previewUrl?.signedUrl,
          message: 'Showing 2-page preview. Upgrade to view full report.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Return signed URL for full PDF
      const { data: fullUrl } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPdfPath, 600);

      const { data: downloadUrl } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPdfPath, 600);

      return new Response(
        JSON.stringify({ 
          type: 'full',
          url: fullUrl?.signedUrl,
          downloadUrl: downloadUrl?.signedUrl
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in get-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

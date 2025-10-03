import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://idea-to-pdf-genie.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's JWT for auth
    const userToken = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get reportId from query params
    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId');
    if (!reportId) {
      throw new Error('Missing reportId parameter');
    }

    // Get user's plan from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    const userPlan = profile?.plan || 'free';
    const fullPdfPath = `private/${user.id}/${reportId}.pdf`;
    const previewPath = `previews/${reportId}-preview2.pdf`;

    console.log(`User ${user.id} with plan ${userPlan} requesting report ${reportId}`);

    if (userPlan === 'free') {
      // Check if preview already exists
      const { data: existingPreview } = await supabase.storage
        .from('business-plans')
        .download(previewPath);

      if (existingPreview) {
        console.log('Serving cached preview');
        return new Response(existingPreview, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${reportId}-preview.pdf"`,
          },
        });
      }

      // Download full PDF
      const { data: fullPdf, error: downloadError } = await supabase.storage
        .from('business-plans')
        .download(fullPdfPath);

      if (downloadError || !fullPdf) {
        console.error('Error downloading full PDF:', downloadError);
        throw new Error('PDF not found');
      }

      // Generate 2-page preview using pdf-lib
      const pdfBytes = await fullPdf.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const previewDoc = await PDFDocument.create();

      // Copy first 2 pages
      const pagesToCopy = Math.min(2, pdfDoc.getPageCount());
      const copiedPages = await previewDoc.copyPages(pdfDoc, Array.from({ length: pagesToCopy }, (_, i) => i));
      
      copiedPages.forEach(page => {
        previewDoc.addPage(page);
      });

      const previewBytes = await previewDoc.save();
      const previewBlob = new Blob([previewBytes], { type: 'application/pdf' });

      // Cache the preview
      await supabase.storage
        .from('business-plans')
        .upload(previewPath, previewBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      console.log('Generated and cached preview');

      return new Response(previewBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${reportId}-preview.pdf"`,
        },
      });
    } else {
      // Pro user - generate signed URL for full PDF
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('business-plans')
        .createSignedUrl(fullPdfPath, 600); // 10 minutes

      if (signedUrlError || !signedUrlData) {
        console.error('Error creating signed URL:', signedUrlError);
        throw new Error('Failed to generate download URL');
      }

      console.log('Generated signed URL for pro user');

      return new Response(
        JSON.stringify({
          type: 'full',
          url: signedUrlData.signedUrl,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in get-report:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

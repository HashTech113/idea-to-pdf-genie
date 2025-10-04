import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET = 'business-plans';
const SIGN_TTL = 600; // 10 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId');

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'reportId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle();

    const userPlan = profile?.plan || 'free';
    const isFree = userPlan === 'free';

    const fullPath = `private/${user.id}/${reportId}.pdf`;
    const previewPath = `previews/${reportId}-preview2.pdf`;

    // Helper to create signed URL
    async function createSignedUrl(path: string) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGN_TTL);
      
      if (error || !data?.signedUrl) {
        throw new Error(`Failed to sign URL for ${path}: ${error?.message}`);
      }
      return data.signedUrl;
    }

    // For paid users, return full PDF
    if (!isFree) {
      const viewUrl = await createSignedUrl(fullPath);
      const downloadUrl = viewUrl + '&download=business-plan.pdf';
      
      return new Response(
        JSON.stringify({ type: 'full', url: viewUrl, downloadUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For free users, check if preview exists
    const { data: previewFiles } = await supabase.storage
      .from(BUCKET)
      .list('previews', { 
        search: `${reportId}-preview2.pdf`,
        limit: 1 
      });

    if (previewFiles && previewFiles.length > 0) {
      const viewUrl = await createSignedUrl(previewPath);
      const downloadUrl = viewUrl + '&download=business-plan-preview.pdf';
      
      return new Response(
        JSON.stringify({ type: 'preview', url: viewUrl, downloadUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate preview from full PDF
    console.log('Generating 2-page preview from full PDF');
    
    const { data: fullPdfData, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(fullPath);

    if (downloadError || !fullPdfData) {
      console.error('Failed to download full PDF:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullPdfBytes = await fullPdfData.arrayBuffer();
    const srcDoc = await PDFDocument.load(fullPdfBytes);
    const pageCount = Math.min(2, srcDoc.getPageCount());

    const previewDoc = await PDFDocument.create();
    const pages = await previewDoc.copyPages(srcDoc, Array.from({ length: pageCount }, (_, i) => i));
    pages.forEach(page => previewDoc.addPage(page));
    
    const previewBytes = await previewDoc.save();

    // Upload preview
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(previewPath, previewBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload preview:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create preview' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Preview created successfully');

    const viewUrl = await createSignedUrl(previewPath);
    const downloadUrl = viewUrl + '&download=business-plan-preview.pdf';

    return new Response(
      JSON.stringify({ type: 'preview', url: viewUrl, downloadUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-report function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

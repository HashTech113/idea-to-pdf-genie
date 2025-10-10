import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,apikey,x-client-info,content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    let reportId: string | null = null;

    // Try to get reportId from JSON body first
    try {
      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await req.json();
        reportId = body.reportId;
      }
    } catch {
      // If JSON parsing fails, try query params
    }

    // Fallback to query params if not found in body
    if (!reportId) {
      const url = new URL(req.url);
      reportId = url.searchParams.get("reportId");
    }
    
    if (!reportId) {
      return new Response(JSON.stringify({ error: "Missing reportId" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try multiple possible paths for the preview/final PDF
    const candidates = [
      `${reportId}-preview.pdf`,  // Root directory
      `${reportId}.pdf`,          // Root directory without -preview
      `previews/${reportId}-preview2.pdf`,
      `previews/${reportId}-preview.pdf`,
      `previews/${reportId}.pdf`,
      `reports/${reportId}.pdf`,
      `pdfs/${reportId}.pdf`,
      `${reportId}-full.pdf`,
    ];

    console.log(`Checking candidates for reportId: ${reportId}`);

    for (const path of candidates) {
      const { data, error } = await supabase.storage
        .from("business-plans")
        .createSignedUrl(path, 300);

      if (data?.signedUrl && !error) {
        console.log(`✓ Found preview at: ${path}`);
        return new Response(
          JSON.stringify({ previewUrl: data.signedUrl, path }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Search in root directory
    console.log('Searching root directory...');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from("business-plans")
      .list("", { search: reportId });

    if (rootFiles && rootFiles.length > 0) {
      console.log(`Found ${rootFiles.length} file(s) in root:`, rootFiles.map(f => f.name));
      const pdfFile = rootFiles.find(f => f.name.endsWith('.pdf') && f.name.includes(reportId));
      
      if (pdfFile) {
        const filePath = pdfFile.name;
        const { data, error } = await supabase.storage
          .from("business-plans")
          .createSignedUrl(filePath, 300);

        if (data?.signedUrl) {
          console.log(`✓ Found PDF in root: ${filePath}`);
          return new Response(
            JSON.stringify({ previewUrl: data.signedUrl, path: filePath }),
            {
              status: 200,
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Try directory search in previews folder
    console.log('Searching previews directory...');
    const { data: fileList, error: listError } = await supabase.storage
      .from("business-plans")
      .list("previews", { search: reportId });

    if (fileList && fileList.length > 0) {
      console.log(`Found ${fileList.length} file(s) in previews:`, fileList.map(f => f.name));
      const preview2 = fileList.find(f => f.name.includes(`${reportId}-preview2.pdf`));
      const previewFile = preview2 || fileList.find(f => f.name.endsWith('.pdf'));
      
      if (previewFile) {
        const filePath = `previews/${previewFile.name}`;
        const { data, error } = await supabase.storage
          .from("business-plans")
          .createSignedUrl(filePath, 300);

        if (data?.signedUrl) {
          console.log(`✓ Found preview via search: ${filePath}`);
          return new Response(
            JSON.stringify({ previewUrl: data.signedUrl, path: filePath }),
            {
              status: 200,
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Search all directories
    console.log('Searching all directories...');
    const directories = ["reports", "pdfs", "generated"];
    for (const dir of directories) {
      const { data: dirFiles } = await supabase.storage
        .from("business-plans")
        .list(dir, { search: reportId });

      if (dirFiles && dirFiles.length > 0) {
        console.log(`Found ${dirFiles.length} file(s) in ${dir}:`, dirFiles.map(f => f.name));
        const pdfFile = dirFiles.find(f => f.name.endsWith('.pdf'));
        
        if (pdfFile) {
          const filePath = `${dir}/${pdfFile.name}`;
          const { data, error } = await supabase.storage
            .from("business-plans")
            .createSignedUrl(filePath, 300);

          if (data?.signedUrl) {
            console.log(`✓ Found PDF in ${dir}: ${filePath}`);
            return new Response(
              JSON.stringify({ previewUrl: data.signedUrl, path: filePath }),
              {
                status: 200,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
              }
            );
          }
        }
      }
    }

    // If none found, return 200 with preparing status for graceful polling
    console.log(`No preview found yet for reportId: ${reportId}`);
    return new Response(JSON.stringify({ status: "preparing" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-preview-pdf:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});

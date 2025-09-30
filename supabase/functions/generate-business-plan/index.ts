import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod-like validation helper (Deno-compatible)
const validateFormData = (data: any) => {
  const errors: string[] = [];
  
  if (!data.businessName || typeof data.businessName !== 'string' || !data.businessName.trim()) {
    errors.push('businessName is required');
  }
  if (!data.businessDescription || typeof data.businessDescription !== 'string' || !data.businessDescription.trim()) {
    errors.push('businessDescription is required');
  }
  if (!data.numberOfEmployees || typeof data.numberOfEmployees !== 'string') {
    errors.push('numberOfEmployees is required');
  }
  if (!data.customerLocation || typeof data.customerLocation !== 'string' || !data.customerLocation.trim()) {
    errors.push('customerLocation is required');
  }
  if (!data.offeringType || typeof data.offeringType !== 'string') {
    errors.push('offeringType is required');
  }
  if (!data.deliveryMethod || typeof data.deliveryMethod !== 'string') {
    errors.push('deliveryMethod is required');
  }
  
  return errors;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Generate Business Plan - Request received');

  try {
    // Step 1: Parse request body
    let formData;
    try {
      formData = await req.json();
      console.log('Step 1: Request parsed successfully');
    } catch (err) {
      console.error('Step 1 ERROR: Failed to parse request body', err);
      return new Response(
        JSON.stringify({ 
          step: 'parse_request', 
          message: 'Invalid JSON in request body',
          details: String(err)
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Validate form data
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      console.error('Step 2 ERROR: Validation failed', validationErrors);
      return new Response(
        JSON.stringify({ 
          step: 'validation', 
          message: 'Form validation failed',
          errors: validationErrors
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('Step 2: Validation passed');

    // Step 3: Call n8n webhook to generate PDF
    let n8nResponse;
    try {
      console.log('Step 3: Calling n8n webhook...');
      n8nResponse = await fetch(
        'https://hashirceo.app.n8n.cloud/webhook-test/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text().catch(() => 'No error message');
        console.error('Step 3 ERROR: n8n webhook failed', { 
          status: n8nResponse.status, 
          statusText: n8nResponse.statusText,
          errorText 
        });
        return new Response(
          JSON.stringify({ 
            step: 'n8n_webhook', 
            message: `n8n webhook returned ${n8nResponse.status}: ${n8nResponse.statusText}`,
            details: errorText
          }), 
          { 
            status: n8nResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      console.log('Step 3: n8n webhook successful');
    } catch (err) {
      console.error('Step 3 ERROR: Network error calling n8n webhook', err);
      return new Response(
        JSON.stringify({ 
          step: 'n8n_webhook', 
          message: 'Failed to connect to PDF generation service',
          details: String(err)
        }), 
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 4: Extract PDF blob
    let pdfBlob;
    try {
      console.log('Step 4: Extracting PDF blob...');
      pdfBlob = await n8nResponse.blob();
      
      if (pdfBlob.size === 0) {
        console.error('Step 4 ERROR: PDF blob is empty');
        return new Response(
          JSON.stringify({ 
            step: 'pdf_extraction', 
            message: 'Generated PDF is empty',
            details: 'The PDF generation service returned an empty file'
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      console.log('Step 4: PDF extracted successfully', { size: pdfBlob.size });
    } catch (err) {
      console.error('Step 4 ERROR: Failed to extract PDF blob', err);
      return new Response(
        JSON.stringify({ 
          step: 'pdf_extraction', 
          message: 'Failed to extract PDF from response',
          details: String(err)
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 5: Return PDF to client
    console.log('Step 5: Returning PDF to client');
    return new Response(pdfBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="business-plan.pdf"',
      },
    });

  } catch (err) {
    // Catch-all error handler
    console.error('UNEXPECTED ERROR:', err);
    return new Response(
      JSON.stringify({ 
        step: 'unknown', 
        message: 'An unexpected error occurred',
        details: String(err)
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

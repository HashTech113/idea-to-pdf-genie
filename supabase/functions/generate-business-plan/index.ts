import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Validation schema for form data
const FormDataSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(255),
  businessDescription: z.string().min(1, 'Business description is required'),
  numberOfEmployees: z.string().min(1, 'Number of employees is required'),
  customerLocation: z.string().min(1, 'Customer location is required'),
  offeringType: z.string().min(1, 'Offering type is required'),
  deliveryMethod: z.string().min(1, 'Delivery method is required'),
  planLanguage: z.string().default('English'),
  customerGroups: z.array(z.object({
    description: z.string(),
    incomeLevel: z.string(),
  })).optional(),
  productsServices: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
  successDrivers: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  planCurrency: z.string().default('USD'),
  investments: z.array(z.object({
    item: z.string(),
    amount: z.number(),
  })).optional(),
  firstYearRevenue: z.string().optional(),
  yearlyGrowth: z.string().optional(),
  operationsCosts: z.array(z.object({
    category: z.string(),
    percentage: z.number(),
    amount: z.number(),
  })).optional(),
})

function createErrorResponse(step: string, message: string, details?: any, status = 500) {
  const error = {
    ok: false,
    step,
    message,
    details: details ? String(details) : undefined,
    timestamp: new Date().toISOString(),
  }
  console.error('Error Response:', JSON.stringify(error))
  return new Response(
    JSON.stringify(error),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Step 1: Parse and validate request body
    let requestBody: any
    try {
      requestBody = await req.json()
      console.log('Received request for business:', requestBody.businessName)
    } catch (parseError) {
      return createErrorResponse('parse_request', 'Invalid JSON in request body', parseError, 400)
    }

    // Step 2: Validate form data with Zod
    const validation = FormDataSchema.safeParse(requestBody)
    if (!validation.success) {
      console.error('Validation errors:', validation.error.issues)
      return createErrorResponse(
        'validation', 
        'Form data validation failed', 
        validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
        400
      )
    }

    const formData = validation.data
    console.log('Validated form data for:', formData.businessName)

    // Step 3: Call n8n webhook to generate PDF

    console.log('Calling n8n webhook for PDF generation...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let response: Response
    try {
      response = await fetch('https://hashirceo.app.n8n.cloud/webhook-test/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const isAbortError = fetchError instanceof Error && fetchError.name === 'AbortError'
      if (isAbortError) {
        return createErrorResponse('n8n_timeout', 'PDF generation timed out after 10 seconds', fetchError)
      }
      return createErrorResponse('n8n_network', 'Failed to reach n8n webhook', fetchError)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details')
      console.error('n8n webhook error:', response.status, response.statusText, errorText)
      return createErrorResponse(
        'n8n_generation',
        `n8n returned ${response.status}: ${response.statusText}`,
        errorText,
        response.status
      )
    }

    // Step 4: Extract PDF blob
    let blob: Blob
    let arrayBuffer: ArrayBuffer
    try {
      blob = await response.blob()
      arrayBuffer = await blob.arrayBuffer()
      console.log('PDF generated successfully, size:', arrayBuffer.byteLength, 'bytes')
    } catch (blobError) {
      return createErrorResponse('pdf_extraction', 'Failed to extract PDF from n8n response', blobError)
    }

    if (arrayBuffer.byteLength === 0) {
      return createErrorResponse('pdf_empty', 'n8n returned an empty PDF', null, 500)
    }

    // Step 5: Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return createErrorResponse('config', 'Missing Supabase configuration', null, 500)
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    console.log('Supabase client initialized')

    // Step 6: Build storage path
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const safeName = formData.businessName
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) // Limit length
    
    const fileName = `${safeName}-${now.getTime()}.pdf`
    const path = `business-plans/${yyyy}/${mm}/${dd}/${fileName}`
    console.log('Storage path:', path)

    // Step 7: Upload PDF to Storage
    const { error: uploadError } = await supabase
      .storage
      .from('business-plans')
      .upload(path, blob, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      return createErrorResponse('storage_upload', 'Failed to upload PDF to storage', uploadError.message)
    }

    console.log('PDF uploaded to storage successfully')

    // Step 8: Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('business-plans')
      .getPublicUrl(path)
    
    const pdfUrl = publicUrlData?.publicUrl ?? null
    console.log('Public URL generated:', pdfUrl)

    // Step 9: Insert database record
    const { error: dbError } = await supabase
      .from('business_plans')
      .insert({
        business_name: formData.businessName,
        form_data: formData,
        pdf_path: path,
        pdf_url: pdfUrl,
      })

    if (dbError) {
      console.error('Database insert failed:', dbError)
      return createErrorResponse('database_insert', 'Failed to save business plan record', dbError.message)
    }

    console.log('✅ Business plan saved successfully:', { businessName: formData.businessName, path, pdfUrl })

    // Return the PDF for download
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=business-plan.pdf',
      },
    });

  } catch (error) {
    console.error('❌ Unexpected error in generate-business-plan function:', error)
    return createErrorResponse(
      'unexpected_error',
      error instanceof Error ? error.message : 'Internal server error',
      error,
      500
    )
  }
})
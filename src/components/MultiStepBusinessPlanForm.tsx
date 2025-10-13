Steps to Fix:
1. Add HTTP Request Node in n8n Workflow
After your n8n workflow generates the PDF and uploads it to Supabase Storage, add an HTTP Request node with these settings:

Node Configuration:

Method: POST
URL: https://tvznnerrgaprchburewu.supabase.co/functions/v1/update-pdf-status
Authentication: None (the edge function uses service role key internally)
Headers:
Content-Type: application/json
Body (JSON):

{
  "reportId": "{{$node["Webhook"].json["reportId"]}}",
  "pdfUrl": "https://tvznnerrgaprchburewu.supabase.co/storage/v1/object/public/business-plans/pdf-path/d9e8a274-821f-42ac-bc78-d643e3f4d22a/cloud kitchen.pdf",
  "previewPdfUrl": "https://tvznnerrgaprchburewu.supabase.co/storage/v1/object/public/business-plans/pdf-path/d9e8a274-821f-42ac-bc78-d643e3f4d22a/cloud kitchen.pdf",
  "fullPdfUrl": "https://tvznnerrgaprchburewu.supabase.co/storage/v1/object/public/business-plans/pdf-path/d9e8a274-821f-42ac-bc78-d643e3f4d22a/cloud kitchen.pdf"
}
Important:

Replace the hardcoded URL with the actual expression/variable from your n8n workflow that contains the generated PDF URL
The reportId should come from the initial webhook trigger
You can send the same URL for all three fields (pdfUrl, previewPdfUrl, fullPdfUrl) if you only generate one PDF
2. Error Handling in n8n
If PDF generation fails in n8n, send this payload instead:


{
  "reportId": "{{$node["Webhook"].json["reportId"]}}",
  "error": "Detailed error message here"
}
This will update the job status to 'failed' and stop the loading spinner with an error message.

3. Testing the Fix
After configuring n8n:

Submit a new business plan form
n8n will receive the webhook
n8n generates the PDF and uploads to storage
n8n POSTs to update-pdf-status with the PDF URL
The jobs table gets updated with status: 'completed' and preview_pdf_path: [your-pdf-url]
The frontend polling detects the URL and stops loading, displays the PDF
Expected Outcome:
✅ Loading spinner stops as soon as PDF URL is available
✅ PDF displays immediately in iframe
✅ No more stuck "processing" jobs
✅ User sees the PDF within seconds of n8n completion
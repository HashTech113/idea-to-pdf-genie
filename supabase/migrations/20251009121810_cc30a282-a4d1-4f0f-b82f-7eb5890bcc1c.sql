-- Add columns to jobs table for tracking completion
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_jobs_report_id_status ON jobs(report_id, status);

-- Add comment for documentation
COMMENT ON COLUMN jobs.completed_at IS 'Timestamp when the n8n workflow completed and the PDF was generated';
COMMENT ON COLUMN jobs.pdf_path IS 'Path to the generated PDF in Supabase Storage (e.g., previews/{reportId}-preview2.pdf)';
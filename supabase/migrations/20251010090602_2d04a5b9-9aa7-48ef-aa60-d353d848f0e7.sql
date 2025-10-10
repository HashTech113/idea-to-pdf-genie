-- Add preview_pdf_path column to jobs table for storing 2-page preview URL
ALTER TABLE jobs 
ADD COLUMN preview_pdf_path text,
ADD COLUMN full_pdf_path text;

-- Update existing records to use pdf_path as full_pdf_path
UPDATE jobs 
SET full_pdf_path = pdf_path 
WHERE pdf_path IS NOT NULL;
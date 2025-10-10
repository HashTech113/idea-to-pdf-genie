import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { FormData } from "./MultiStepBusinessPlanForm";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: FormData;
}

export const PreviewModal = ({ open, onClose, formData }: PreviewModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const pollForPreview = async (id: string, startTime: number = Date.now()) => {
    const maxPollingTime = 600000; // 10 minutes
    
    const poll = async (attempt: number) => {
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime > maxPollingTime) {
        setError('PDF generation is taking longer than expected. Please check back in a few minutes.');
        setIsGenerating(false);
        return;
      }

      setPollingAttempts(attempt);

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          setError('Session expired. Please log in again.');
          setIsGenerating(false);
          return;
        }

        // Get PDF URL directly from job record (n8n webhook provides public URLs)
        const { data: jobData } = await supabase
          .from('jobs')
          .select('status, error_message, preview_pdf_path')
          .eq('report_id', id)
          .maybeSingle();

        if (jobData?.status === 'failed') {
          setError(`PDF generation failed: ${jobData.error_message || 'Unknown error'}`);
          setIsGenerating(false);
          return;
        }

        // If preview URL is available, use it directly (no signing needed - it's public)
        if (jobData?.preview_pdf_path) {
          console.log('Using direct public preview URL:', jobData.preview_pdf_path);
          setPreviewUrl(jobData.preview_pdf_path);
          setIsGenerating(false);
          return;
        }

        // Still processing, continue polling with backoff
        const delay = Math.min(3000 * Math.pow(1.5, attempt), 20000);
        setTimeout(() => poll(attempt + 1), delay);
      } catch (err: any) {
        console.error('Error polling for preview:', err);
        setError(err.message || 'Failed to load preview');
        setIsGenerating(false);
      }
    };

    poll(0);
  };

  const handleContinue = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setPreviewUrl(null);
      setPollingAttempts(0);
      
      // Refresh session to ensure valid token
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !currentSession) {
        setError("Session expired. Please log in again.");
        setIsGenerating(false);
        navigate('/login');
        return;
      }

      // Generate a unique reportId
      const id = crypto.randomUUID();
      setReportId(id);

      // Create job record first
      const { error: jobError } = await (supabase as any)
        .from('jobs')
        .insert({
          report_id: id,
          user_id: currentSession.user.id,
          status: 'queued',
          form_data: formData
        });

      if (jobError) {
        console.error('Job creation error:', jobError);
        throw new Error('Failed to create job record. Please try again.');
      }
      
      // Trigger PDF generation with explicit authorization
      const { data, error: generateError } = await supabase.functions.invoke('generate-business-plan', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: {
          userId: currentSession.user.id,
          reportId: id,
          formData: formData,
        },
      });

      if (generateError) {
        throw new Error(generateError.message || 'Failed to start PDF generation');
      }

      // Start polling for the preview after 3 seconds with start time
      setTimeout(() => pollForPreview(id, Date.now()), 3000);
      
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      setError(error.message || 'Failed to generate PDF');
      setIsGenerating(false);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins text-gray-900">
            {previewUrl ? 'Business Plan Preview (First 2 Pages)' : 'Generate Business Plan'}
          </DialogTitle>
          <DialogDescription>
            {previewUrl 
              ? 'Your comprehensive business plan preview is ready.' 
              : 'Generate and download your comprehensive business plan report.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4 flex items-center justify-center">
          {!isGenerating && !previewUrl && !error && (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Download className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Ready to Generate Your Business Plan
              </h3>
              <p className="text-muted-foreground max-w-md">
                Click "View Preview" below to generate your comprehensive business plan report.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <h3 className="text-xl font-semibold text-foreground">
                Generating your PDF...
              </h3>
               <p className="text-muted-foreground max-w-md">
                This may take up to 5 minutes. Please don't close this window.
              </p>
              {pollingAttempts > 0 && (
                <p className="text-xs text-muted-foreground">
                  Checking status... (attempt {pollingAttempts})
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <h3 className="text-xl font-semibold text-foreground">
                Generation Failed
              </h3>
              <p className="text-muted-foreground max-w-md">
                {error}
              </p>
              <Button onClick={handleContinue} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {previewUrl && !isGenerating && (
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Preview Generated Successfully
              </h3>
              <p className="text-muted-foreground max-w-md">
                Your business plan preview is ready.
              </p>
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-primary hover:underline"
              >
                Open PDF in new tab
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground flex-1">
            {previewUrl 
              ? 'Upgrade to Pro to download the full business plan' 
              : 'Generate your business plan preview (first 2 pages)'}
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleViewPricing}
              variant="outline"
            >
              View Pricing
            </Button>
            
            {!previewUrl && (
              <Button
                onClick={handleContinue}
                disabled={isGenerating}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'View Preview'
                )}
              </Button>
            )}

            {previewUrl && reportId && (
              <Button
                onClick={() => navigate(`/preview/${reportId}`)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Download Full Plan
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { FormData } from "./MultiStepBusinessPlanForm";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: FormData;
}

export const PreviewModal = ({ open, onClose, formData }: PreviewModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const pollForPreview = async (id: string, session: any) => {
    const maxAttempts = 60; // Poll for up to 60 attempts (5 minutes with 5-second intervals)
    
    const poll = async (attempt: number) => {
      if (attempt >= maxAttempts) {
        setError('PDF generation is taking longer than expected. Please try again.');
        setIsGenerating(false);
        return;
      }

      setPollingAttempts(attempt);

      try {
        const response = await fetch(
          `https://tvznnerrgaprchburewu.supabase.co/functions/v1/sign-report?reportId=${id}&exp=300`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPreviewUrl(data.previewUrl);
          setIsGenerating(false);
          return;
        }

        if (response.status === 409) {
          // Preview not ready yet, poll again after 5 seconds
          setTimeout(() => poll(attempt + 1), 5000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch preview');
        }
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

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Generate a unique reportId
      const id = crypto.randomUUID();
      setReportId(id);
      
      // Trigger PDF generation
      const { data, error: generateError } = await supabase.functions.invoke('generate-business-plan', {
        body: {
          userId: session.user.id,
          reportId: id,
          formData: formData,
        },
      });

      if (generateError) {
        throw new Error(generateError.message || 'Failed to start PDF generation');
      }

      // Start polling for the preview
      pollForPreview(id, session);
      
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
                Please wait while we create your business plan preview. This usually takes a few moments.
              </p>
              {pollingAttempts > 10 && (
                <p className="text-sm text-muted-foreground">
                  Still generating... ({pollingAttempts * 5} seconds elapsed)
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
            <object
              data={previewUrl}
              type="application/pdf"
              className="w-full h-full border-0 rounded-lg shadow-lg"
              aria-label="Business Plan Preview"
            >
              <p className="text-center text-muted-foreground p-4">
                Unable to display PDF. <a href={previewUrl} className="text-primary underline" target="_blank" rel="noopener noreferrer">Download PDF</a>
              </p>
            </object>
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

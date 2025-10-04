import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { FormData } from "./MultiStepBusinessPlanForm";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: FormData;
}

interface PdfData {
  type: 'preview' | 'full';
  url: string;
  downloadUrl: string;
}

export const PreviewModal = ({ open, onClose, formData }: PreviewModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfData, setPdfData] = useState<PdfData | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate your business plan",
          variant: "destructive",
        });
        return;
      }

      // Generate PDF
      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        'generate-business-plan',
        {
          body: formData,
        }
      );

      if (generateError) throw generateError;
      if (!generateData?.reportId) throw new Error('No report ID returned');

      // Get signed URL
      const { data: reportData, error: reportError } = await supabase.functions.invoke(
        'get-report',
        {
          body: { reportId: generateData.reportId },
        }
      );

      if (reportError) throw reportError;

      setPdfData(reportData as PdfData);

      toast({
        title: "Success!",
        description: "Your business plan has been generated",
      });

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate business plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] w-full h-[95vh] flex flex-col"
        aria-describedby="pdf-preview-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins">
            {pdfData ? (pdfData.type === 'preview' ? 'Preview (First 2 Pages)' : 'Your Business Plan') : 'Generate Business Plan'}
          </DialogTitle>
          <DialogDescription id="pdf-preview-description">
            {pdfData 
              ? 'View and download your business plan report' 
              : 'Click Generate to create your comprehensive business plan'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!pdfData ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Download className="w-16 h-16 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  Ready to Generate Your Business Plan
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Click the button below to generate your comprehensive business plan report.
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  size="lg"
                  className="mt-4"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-4">
              <iframe
                src={pdfData.url}
                className="w-full flex-1 rounded-lg border"
                title="Business Plan PDF"
              />
            </div>
          )}
        </div>

        {pdfData && (
          <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 border-t pt-4">
            {pdfData.type === 'preview' && (
              <p className="text-sm text-muted-foreground flex-1">
                Upgrade to Pro to access the full business plan
              </p>
            )}
            
            <div className="flex gap-2">
              {pdfData.type === 'preview' && (
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                >
                  Upgrade to Pro
                </Button>
              )}
              
              <Button
                onClick={() => window.open(pdfData.url, '_blank')}
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in New Tab
              </Button>
              
              <Button
                onClick={() => window.open(pdfData.downloadUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

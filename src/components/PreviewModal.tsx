import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Download } from "lucide-react";
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('generate-business-plan', {
        body: formData,
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (response.error) {
        throw response.error;
      }

      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'business-plan.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Your business plan has been downloaded successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error generating business plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate business plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins text-gray-900">
            Preview report (first 2 pages)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Download className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Your Business Plan is Ready
            </h3>
            <p className="text-muted-foreground max-w-md">
              Click the download button below to generate and download your comprehensive business plan report.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground flex-1">
            Generate and download your business plan, then upgrade to Pro for unlimited access
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleViewPricing}
              variant="outline"
            >
              View Pricing
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

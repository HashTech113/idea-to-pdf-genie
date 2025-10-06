import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
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

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const handleContinue = async () => {
    try {
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
      const reportId = crypto.randomUUID();
      
      // Store form data in sessionStorage for the Generating page
      sessionStorage.setItem(`formData_${reportId}`, JSON.stringify(formData));
      
      // Navigate to generating page
      navigate(`/generating/${reportId}`);
      onClose();
      
    } catch (error) {
      console.error('Error navigating to generating page:', error);
      toast({
        title: "Error",
        description: "Failed to proceed. Please try again.",
        variant: "destructive",
      });
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
              onClick={handleContinue}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import type { FormData } from "./MultiStepBusinessPlanForm";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: FormData;
}

export const PreviewModal = ({ open, onClose, formData }: PreviewModalProps) => {
  const navigate = useNavigate();

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins text-gray-900">
            Generate Business Plan
          </DialogTitle>
          <DialogDescription>
            Complete your business plan purchase
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Download className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Ready to Generate Your Business Plan
            </h3>
            <p className="text-muted-foreground max-w-md">
              Your business plan form has been completed. Click "View Pricing" to proceed.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground flex-1">
            View pricing to generate and download your comprehensive business plan
          </p>
          
          <Button
            onClick={handleViewPricing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            View Pricing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

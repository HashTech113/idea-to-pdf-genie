import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  reportType: 'preview' | 'full';
}

export const PreviewModal = ({ open, onClose, pdfUrl, reportType }: PreviewModalProps) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = () => {
    setIsRedirecting(true);
    // Navigate to pricing page
    window.location.href = '/pricing';
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'business-plan.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const isFree = reportType === 'preview';
  const title = isFree ? 'Preview Report (First 2 Pages)' : 'Your Full Business Plan';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins text-gray-900">
            {title}
          </DialogTitle>
          {isFree && (
            <p className="text-sm text-amber-600 font-medium">
              You're on free trial — upgrade to unlock the full report
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {pdfUrl ? (
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <iframe
                src={`${pdfUrl}#zoom=page-fit`}
                className="w-full h-full"
                title="Business Plan PDF"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 flex-1">
            {isFree 
              ? "Upgrade to Pro to download the complete business plan with all sections." 
              : "Your full business plan is ready to download."}
          </p>
          
          <div className="flex gap-2">
            {isFree && (
              <Button
                onClick={handleUpgrade}
                disabled={isRedirecting}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={handleDownload}
              disabled={isFree || !pdfUrl}
              className={!isFree && pdfUrl
                ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"}
            >
              <Download className="w-4 h-4 mr-2" />
              {isFree ? 'Download Full PDF (Pro Only)' : 'Download PDF'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

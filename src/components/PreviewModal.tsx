import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, Lock, Download } from "lucide-react";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
}

export const PreviewModal = ({ open, onClose, pdfUrl }: PreviewModalProps) => {
  const [isPaid, setIsPaid] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check for payment completion on mount and when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('paid') === 'true') {
      setIsPaid(true);
    }
  }, []);

  const handlePayToUnlock = () => {
    setIsRedirecting(true);
    // Replace with your actual checkout URL
    const checkoutUrl = 'YOUR_CHECKOUT_URL';
    window.location.href = checkoutUrl;
  };

  const handleDownload = () => {
    if (!pdfUrl || !isPaid) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'business-plan.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins text-gray-900">
            Preview report (first 2 pages)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 py-4">
          {pdfUrl ? (
            <>
              {/* Page 1 */}
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  src={`${pdfUrl}#page=1&zoom=page-fit`}
                  className="w-full h-full"
                  title="Page 1"
                />
              </div>

              {/* Page 2 */}
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  src={`${pdfUrl}#page=2&zoom=page-fit`}
                  className="w-full h-full"
                  title="Page 2"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 flex-1">
            {isPaid 
              ? "Payment complete! You can now download the full report." 
              : "Download is locked until payment is completed."}
          </p>
          
          <div className="flex gap-2">
            {!isPaid && (
              <Button
                onClick={handlePayToUnlock}
                disabled={isRedirecting}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>Pay to Unlock</>
                )}
              </Button>
            )}
            
            <Button
              onClick={handleDownload}
              disabled={!isPaid || !pdfUrl}
              className={isPaid 
                ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"}
            >
              {isPaid ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Download PDF (locked)
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

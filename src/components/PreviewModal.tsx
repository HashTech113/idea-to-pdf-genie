import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, Lock, Download, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  isPaidUser: boolean;
}

export const PreviewModal = ({ open, onClose, pdfUrl, isPaidUser }: PreviewModalProps) => {

  const handleDownload = () => {
    if (!pdfUrl || !isPaidUser) return;
    
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
          <DialogTitle className="text-2xl font-poppins text-foreground">
            {isPaidUser ? 'Your Business Plan' : 'Preview Report (First 2 Pages)'}
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

        <DialogFooter className="flex flex-col gap-4 border-t border-border pt-4">
          {!isPaidUser && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Unlock Full Business Plan</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get unlimited downloads and access to the complete market research report with AI-powered insights.
                  </p>
                  <Link to="/pricing">
                    <Button className="w-full sm:w-auto">
                      Upgrade to Pro
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground flex-1">
              {isPaidUser 
                ? "Your full business plan is ready for download." 
                : "Free users can preview the first 2 pages. Upgrade for full access."}
            </p>
            
            <Button
              onClick={handleDownload}
              disabled={!isPaidUser || !pdfUrl}
              variant={isPaidUser ? "default" : "outline"}
            >
              {isPaidUser ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Locked
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

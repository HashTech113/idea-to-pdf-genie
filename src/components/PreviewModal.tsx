import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PdfEmbed } from "./PdfEmbed";
import { PdfButtons } from "./PdfButtons";
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
  const [reportData, setReportData] = useState<{
    type: "preview" | "full";
    url: string;
    downloadUrl: string;
  } | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const handleGenerateAndFetch = async () => {
    setIsGenerating(true);

    try {
      toast({
        title: "Generating your business plan...",
        description: "This may take a few moments.",
      });

      // Step 1: Generate the PDF
      const generateResponse = await fetch('https://tvznnerrgaprchburewu.supabase.co/functions/v1/generate-business-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!generateResponse.ok) {
        throw new Error(`Generate failed (${generateResponse.status})`);
      }

      const generateResult = await generateResponse.json();
      const newReportId = generateResult.reportId || `report-${Date.now()}`;
      setReportId(newReportId);

      toast({
        title: "PDF generated!",
        description: "Fetching your report...",
      });

      // Step 2: Get signed URLs from get-report
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const reportResponse = await fetch(
        `https://tvznnerrgaprchburewu.supabase.co/functions/v1/get-report?reportId=${newReportId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!reportResponse.ok) {
        throw new Error(`Failed to get report URLs (${reportResponse.status})`);
      }

      const data = await reportResponse.json();
      setReportData(data);

      toast({
        title: "Success!",
        description: "Your business plan is ready to view.",
      });

    } catch (error: any) {
      console.error('Error:', error);
      
      toast({
        title: 'Error',
        description: error?.message || 'Failed to generate or fetch report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins">
            {reportData ? (reportData.type === "preview" ? "Preview Report (First 2 Pages)" : "Your Business Plan") : "Generate Business Plan"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {!reportData && !isGenerating && (
            <div className="text-center space-y-6 py-12">
              <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Ready to Generate Your Business Plan
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Click the button below to generate your comprehensive business plan report.
                </p>
              </div>
              <Button
                onClick={handleGenerateAndFetch}
                size="lg"
                className="gap-2"
              >
                Generate PDF
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center space-y-4 py-12">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <p className="text-lg font-medium">Generating your business plan...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          )}

          {reportData && (
            <div className="space-y-6">
              <PdfEmbed url={reportData.url} height="600px" />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                <PdfButtons
                  type={reportData.type}
                  url={reportData.url}
                  downloadUrl={reportData.downloadUrl}
                  allowPreviewDownload={false}
                />
                
                {reportData.type === "preview" && (
                  <Button
                    onClick={handleViewPricing}
                    variant="default"
                    className="gap-2"
                  >
                    Upgrade to Unlock Full PDF
                  </Button>
                )}
              </div>

              {reportData.type === "preview" && (
                <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    You're viewing a preview (first 2 pages). Upgrade to Pro to access the full business plan.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

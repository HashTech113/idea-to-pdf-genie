import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function PreviewReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [error, setError] = useState<string | null>(null);

  const formData = location.state?.formData;

  useEffect(() => {
    if (!formData) {
      navigate('/business-plan');
      return;
    }

    generatePdf();
  }, [formData, navigate]);

  const generatePdf = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Please log in to generate a business plan");
      }

      // Get user's plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setUserPlan((profile as any)?.plan || 'free');

      // Call generate-business-plan edge function
      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        'generate-business-plan',
        {
          body: formData,
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (generateError) throw generateError;

      const generatedReportId = generateData?.reportId;
      setReportId(generatedReportId);

      // Get the PDF URL (preview or full based on plan)
      const { data: reportData, error: reportError } = await supabase.functions.invoke(
        'get-report',
        {
          body: { reportId: generatedReportId },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (reportError) throw reportError;

      setPdfUrl(reportData.url);
      setDownloadUrl(reportData.downloadUrl);

      toast({
        title: "Success",
        description: "Your business plan preview is ready!",
      });
    } catch (error: any) {
      console.error('Error generating business plan:', error);
      setError(error.message || "Failed to generate business plan");
      toast({
        title: "Error",
        description: error.message || "Failed to generate business plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (userPlan === 'free') {
      navigate('/pricing');
      return;
    }

    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Business Plan Preview</h1>
            <Button variant="outline" onClick={() => navigate('/business-plan')}>
              Back to Form
            </Button>
          </div>

          {isGenerating && (
            <div className="bg-card rounded-lg shadow-lg p-12 text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-2xl font-semibold mb-2 text-foreground">Generating Your Business Plan</h2>
              <p className="text-muted-foreground">
                Please wait while we create your comprehensive business plan...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-semibold mb-2 text-destructive">Generation Failed</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={generatePdf}>Try Again</Button>
            </div>
          )}

          {!isGenerating && !error && pdfUrl && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {userPlan === 'free' ? 'Preview (First 2 Pages)' : 'Full Business Plan'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {userPlan === 'free' 
                        ? 'Upgrade to Pro to access the full business plan'
                        : 'Your complete business plan is ready'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {userPlan === 'free' ? (
                      <Button onClick={handleViewPricing} className="bg-primary text-primary-foreground">
                        Upgrade to Download
                      </Button>
                    ) : (
                      <Button onClick={handleDownload} className="bg-primary text-primary-foreground">
                        <Download className="w-4 h-4 mr-2" />
                        Download Full PDF
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden bg-background" style={{ height: '800px' }}>
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="Business Plan Preview"
                  />
                </div>
              </div>

              {userPlan === 'free' && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Want the Full Business Plan?</h3>
                  <p className="text-muted-foreground mb-4">
                    Upgrade to Pro to access all pages and download your complete business plan
                  </p>
                  <Button onClick={handleViewPricing} className="bg-primary text-primary-foreground">
                    View Pricing Plans
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

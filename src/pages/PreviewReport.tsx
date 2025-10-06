import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PreviewReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    const formDataString = searchParams.get("data");
    if (!formDataString) {
      navigate("/business-plan");
      return;
    }

    const loadUserPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (profile && 'plan' in profile) {
          setUserPlan(profile.plan as string);
        }
      }
    };

    const generatePdf = async () => {
      try {
        const formData = JSON.parse(formDataString);
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

        // Get the report URL from get-report edge function
        const { data: reportData, error: reportError } = await supabase.functions.invoke('get-report', {
          body: { reportId: response.data.reportId },
          headers: session?.access_token ? {
            Authorization: `Bearer ${session.access_token}`
          } : undefined
        });

        if (reportError) {
          throw reportError;
        }

        setPdfUrl(reportData.url);
        setIsGenerating(false);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Failed to generate business plan. Please try again.",
          variant: "destructive",
        });
        navigate("/business-plan");
      }
    };

    loadUserPlan();
    generatePdf();
  }, [searchParams, navigate, toast]);

  const handleDownload = async () => {
    if (userPlan === "free") {
      navigate("/pricing");
      return;
    }

    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'business-plan.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Your business plan has been downloaded.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/business-plan")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Form
        </Button>

        <div className="bg-card rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-poppins font-bold text-foreground">
              {isGenerating ? "Generating Your Business Plan..." : "Preview Report (First 2 Pages)"}
            </h1>
            
            {!isGenerating && (
              <div className="flex gap-2">
                {userPlan === "free" && (
                  <Button
                    onClick={() => navigate("/pricing")}
                    variant="outline"
                  >
                    Upgrade to Pro
                  </Button>
                )}
                <Button
                  onClick={handleDownload}
                  disabled={userPlan === "free"}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            )}
          </div>

          <div className="bg-muted rounded-lg" style={{ height: "calc(100vh - 250px)" }}>
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">
                  Generating your business plan...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a minute. Please keep this tab open.
                </p>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-lg"
                title="Business Plan Preview"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Failed to load preview</p>
              </div>
            )}
          </div>

          {!isGenerating && userPlan === "free" && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground">
                📄 You're viewing a 2-page preview. Upgrade to Pro to access the full report and download capabilities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewReport;

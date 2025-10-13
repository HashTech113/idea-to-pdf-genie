import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Preview() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (!reportId) {
      navigate('/');
      return;
    }

    const checkJobStatus = async () => {
      try {
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('report_id', reportId)
          .single();

        if (jobError) throw jobError;

        if (job.status === 'completed' && job.preview_pdf_path) {
          setPreviewPdfUrl(job.preview_pdf_path);
          setIsLoading(false);
        } else if (job.status === 'failed') {
          setError(job.error_message || 'PDF generation failed');
          setIsLoading(false);
        } else {
          // Still processing, poll again
          setTimeout(checkJobStatus, 2000);
        }
      } catch (err) {
        console.error('Error checking job status:', err);
        setError('Failed to load PDF preview');
        setIsLoading(false);
      }
    };

    checkJobStatus();

    // Check if user has paid
    const checkPaymentStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', session.user.id)
          .single();
        
        setHasPaid(profile?.plan === 'premium' || profile?.plan === 'pro');
      }
    };

    checkPaymentStatus();
  }, [reportId, navigate]);

  const handleDownload = () => {
    if (!hasPaid) {
      toast({
        title: "Payment Required",
        description: "Please upgrade to a paid plan to download the full PDF.",
        variant: "destructive",
      });
      navigate('/pricing');
    } else {
      toast({
        title: "Download Started",
        description: "Your full business plan is downloading...",
      });
      // Trigger download of full PDF
      // This would need the full_pdf_path from the job
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Generating Your Business Plan
            </h1>
            <p className="text-muted-foreground text-lg">
              Please wait while we create your comprehensive business plan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center space-y-8">
          <h1 className="text-3xl font-bold text-destructive">
            Error Generating Business Plan
          </h1>
          <p className="text-muted-foreground text-lg">{error}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            Business Plan Preview
          </h1>
          <Button
            onClick={handleDownload}
            className="gap-2"
          >
            {hasPaid ? (
              <>
                <Download className="w-4 h-4" />
                Download Full PDF
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Unlock Full PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* PDF Preview - First 2 pages only */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          {previewPdfUrl ? (
            <iframe
              src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full"
              title="Business Plan Preview (First 2 Pages)"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No preview available</p>
            </div>
          )}
        </div>
        
        {!hasPaid && (
          <div className="mt-6 p-6 bg-muted/50 rounded-lg text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Preview Only</h3>
            <p className="text-muted-foreground mb-4">
              You're viewing the first 2 pages. Upgrade to access the full business plan.
            </p>
            <Button onClick={() => navigate('/pricing')} size="lg">
              View Pricing Plans
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

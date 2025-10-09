import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Preview() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    if (!reportId) return;
    
    let mounted = true;
    let delay = 2000;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts with exponential backoff = ~5 minutes

    const pollForPreview = async () => {
      try {
        attempts++;
        
        if (attempts > maxAttempts) {
          if (mounted) {
            setError('PDF generation is taking longer than expected. Please try again later.');
            setIsGenerating(false);
            setIsLoading(false);
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please log in to view your report.",
            variant: "destructive",
          });
          navigate(`/login?next=/preview/${reportId}`);
          return;
        }

        console.log(`Polling for preview (attempt ${attempts}/${maxAttempts}):`, reportId);

        // Use direct fetch for consistent handling
        const response = await fetch(
          `https://tvznnerrgaprchburewu.supabase.co/functions/v1/get-preview-pdf?reportId=${reportId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2em5uZXJyZ2FwcmNoYnVyZXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTAxNzUsImV4cCI6MjA3NDM2NjE3NX0._vuf_ZB8i-_GFDz2vIc_6y_6FzjeEkGTOKz90sxiEnY',
            },
          }
        );

        // Handle non-OK responses gracefully
        if (response.status === 404 || response.status === 202) {
          console.log('Preview not ready yet (404/202), retrying...');
          if (!mounted) return;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.2, 5000);
          pollForPreview();
          return;
        }

        // Try to parse JSON, handle gracefully if it fails
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.log('JSON parse error (transient), retrying...');
          if (!mounted) return;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.2, 5000);
          pollForPreview();
          return;
        }

        // Handle "preparing" status
        if (data?.status === 'preparing') {
          console.log('Preview not ready yet, retrying...');
          if (!mounted) return;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.2, 5000);
          pollForPreview();
          return;
        }

        // Success case
        if (data?.previewUrl) {
          console.log('Preview URL received:', data.path);
          
          if (mounted) {
            setUrl(data.previewUrl);
            setDownloadUrl(data.previewUrl); // Use the same signed URL for download
            setIsGenerating(false);
            setIsLoading(false);
          }
        } else if (!response.ok) {
          // Only treat as error if response is not OK and we have no previewUrl
          throw new Error(data?.error || 'Failed to load preview');
        }
        
      } catch (error: any) {
        console.error('Error polling for preview:', error);
        if (mounted) {
          // Only show error for true, non-recoverable errors
          if (error.message?.includes('Authentication') || error.message?.includes('network')) {
            setError(error.message || 'Failed to load preview');
            setIsGenerating(false);
            setIsLoading(false);
            toast({
              title: "Error",
              description: error.message || "Failed to load preview. Please try again.",
              variant: "destructive",
            });
          } else {
            // For other errors, just retry
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.2, 5000);
            pollForPreview();
          }
        }
      }
    };

    pollForPreview();
    
    return () => {
      mounted = false;
    };
  }, [reportId, navigate, toast]);

  const handleDownload = () => {
    if (!downloadUrl) {
      toast({
        title: "Download not available",
        description: "Please wait for the preview to load.",
        variant: "destructive",
      });
      return;
    }

    window.open(downloadUrl, '_blank');
    toast({
      title: "Download Started",
      description: "Your business plan is downloading.",
    });
  };

  const handleRetry = () => {
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-6">
        {isGenerating && isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <h2 className="text-2xl font-semibold text-foreground">
              Generating your PDF...
            </h2>
            <p className="text-muted-foreground max-w-md text-center">
              This may take up to 5 minutes. Please don't close this window.
            </p>
            <p className="text-muted-foreground text-sm">
              Your business plan is being created in the background.
            </p>
          </div>
        )}

        {error && error !== 'preview_not_ready' && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <h2 className="text-2xl font-semibold text-foreground">
              Error Loading Preview
            </h2>
            <p className="text-muted-foreground max-w-md text-center">
              {error}
            </p>
            <Button onClick={handleRetry} variant="outline">
              Retry
            </Button>
          </div>
        )}

        {url && !isLoading && !error && (
          <div className="w-full h-full">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Business Plan Preview
            </h1>
            <div className="h-[80vh] w-full rounded-xl overflow-hidden border">
              <iframe
                title="Your PDF"
                src={url}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom-Right Action Bar */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/pricing')}
          className="shadow-lg"
        >
          Pricing
        </Button>
        {downloadUrl && (
          <Button
            onClick={handleDownload}
            className="shadow-lg"
          >
            Download PDF
          </Button>
        )}
      </div>
    </div>
  );
}

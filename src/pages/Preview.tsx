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
  const [retryCount, setRetryCount] = useState(0);

  const fetchPreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

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

      // Call sign-user-pdf function using supabase client
      const { data, error: invokeError } = await supabase.functions.invoke("sign-user-pdf", {
        body: { reportId, exp: 300 }
      });

      if (invokeError) {
        if (invokeError.message?.includes('not_found')) {
          setError('preview_not_ready');
        } else {
          throw new Error(invokeError.message || 'Failed to fetch preview');
        }
        return;
      }

      if (!data?.url) {
        throw new Error('Invalid response from server');
      }
      
      setUrl(data.url);
      setDownloadUrl(data.downloadUrl);
      
    } catch (error: any) {
      console.error('Error fetching preview:', error);
      setError(error.message || 'Failed to load preview');
      toast({
        title: "Error",
        description: "Failed to load preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchPreview();
    }
  }, [reportId, retryCount]);

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
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <h2 className="text-2xl font-semibold text-foreground">
              Loading Preview...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we prepare your business plan preview.
            </p>
          </div>
        )}

        {error === 'preview_not_ready' && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <AlertCircle className="w-16 h-16 text-yellow-500" />
            <h2 className="text-2xl font-semibold text-foreground">
              Preparing Your Preview...
            </h2>
            <p className="text-muted-foreground max-w-md text-center">
              Your business plan is still being generated. This usually takes a few moments.
            </p>
            <Button onClick={handleRetry} variant="outline">
              Retry
            </Button>
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
        <Button
          onClick={handleDownload}
          disabled={!downloadUrl}
          className="shadow-lg"
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
}

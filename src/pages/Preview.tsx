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
  const [jobStatus, setJobStatus] = useState<string>("processing");
  const [loadingMessage, setLoadingMessage] = useState("Generating your business plan...");
  const [pollingStartTime] = useState<number>(Date.now());
  const [isPdfPollingActive, setIsPdfPollingActive] = useState(false);

  // Update loading message based on elapsed time
  useEffect(() => {
    const messageInterval = setInterval(() => {
      const elapsed = Date.now() - pollingStartTime;
      if (elapsed < 30000) {
        setLoadingMessage("Generating your business plan...");
      } else if (elapsed < 120000) {
        setLoadingMessage("Almost there, crafting your comprehensive plan...");
      } else {
        setLoadingMessage("This is taking a bit longer than usual, but we're still working on it...");
      }
    }, 5000);

    return () => clearInterval(messageInterval);
  }, [pollingStartTime]);

  // Start parallel PDF polling after 30 seconds if job is still processing
  useEffect(() => {
    const elapsed = Date.now() - pollingStartTime;
    
    // If already have preview URL or PDF polling is active, do nothing
    if (url || isPdfPollingActive) return;
    
    // If less than 30 seconds, set a timer
    if (elapsed < 30000) {
      const timer = setTimeout(() => {
        if (!url && (jobStatus === 'processing' || jobStatus === 'queued')) {
          console.log('30 seconds elapsed, starting parallel PDF polling');
          setIsPdfPollingActive(true);
        }
      }, 30000 - elapsed);
      return () => clearTimeout(timer);
    }
    
    // If more than 30 seconds and still processing, start polling now
    if (jobStatus === 'processing' || jobStatus === 'queued') {
      console.log('Starting parallel PDF polling (already past 30s)');
      setIsPdfPollingActive(true);
    }
  }, [jobStatus, pollingStartTime, url, isPdfPollingActive]);

  useEffect(() => {
    if (!reportId) return;
    
    let mounted = true;
    let jobPollDelay = 2000;
    let jobAttempts = 0;
    const maxJobAttempts = 150; // 150 * 2s = 5 minutes

    const pollForJobStatus = async () => {
      try {
        jobAttempts++;
        
        if (jobAttempts > maxJobAttempts) {
          if (mounted) {
            setError('Generation is taking longer than expected. Please check back later.');
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

        console.log(`Polling job status (attempt ${jobAttempts}/${maxJobAttempts}):`, reportId);

        // Check job status in database
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('status, error_message, pdf_path, completed_at')
          .eq('report_id', reportId)
          .maybeSingle();

        if (jobError) {
          console.error('Error fetching job status:', jobError);
          if (!mounted) return;
          
          await new Promise(resolve => setTimeout(resolve, jobPollDelay));
          pollForJobStatus();
          return;
        }

        if (!job) {
          console.log('Job not found yet, retrying...');
          if (!mounted) return;
          
          await new Promise(resolve => setTimeout(resolve, jobPollDelay));
          pollForJobStatus();
          return;
        }

        console.log('Job status:', job.status, 'Path:', job.pdf_path);
        if (mounted) {
          setJobStatus(job.status);
        }

        if (job.status === 'completed' && job.pdf_path) {
          // Job is complete, now fetch the PDF preview
          console.log('Job completed, fetching PDF preview...');
          pollForPdfPreview();
          return;
        }

        if (job.status === 'failed') {
          if (mounted) {
            setError(job.error_message || 'PDF generation failed. Please try again.');
            setIsGenerating(false);
            setIsLoading(false);
          }
          return;
        }

        // Still processing, continue polling with backoff
        if (!mounted) return;
        
        jobPollDelay = Math.min(jobPollDelay * 1.1, 5000);
        await new Promise(resolve => setTimeout(resolve, jobPollDelay));
        pollForJobStatus();
        
      } catch (err) {
        console.error('Error in job status polling:', err);
        if (!mounted) return;
        
        await new Promise(resolve => setTimeout(resolve, jobPollDelay));
        pollForJobStatus();
      }
    };

    const pollForPdfPreview = async () => {
      // Prevent duplicate polling if URL already found
      if (url) {
        console.log('Preview URL already set, skipping PDF polling');
        return;
      }
      
      let pdfAttempts = 0;
      const maxPdfAttempts = 60; // 60 * 2s = 2 minutes for PDF file polling
      let pdfDelay = 2000;

      const poll = async () => {
        // Stop if we already have a preview URL (from parallel polling)
        if (url) {
          console.log('Preview URL found by another poller, stopping');
          setIsPdfPollingActive(false);
          return;
        }
        
        try {
          pdfAttempts++;
          
          if (pdfAttempts > maxPdfAttempts) {
            if (mounted) {
              setError('PDF preview is taking longer than expected. Please try refreshing the page.');
              setIsGenerating(false);
              setIsLoading(false);
              setIsPdfPollingActive(false);
            }
            return;
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            navigate(`/login?next=/preview/${reportId}`);
            return;
          }

          console.log(`Polling for PDF file (attempt ${pdfAttempts}/${maxPdfAttempts})...`);

          const response = await fetch(
            `https://tvznnerrgaprchburewu.supabase.co/functions/v1/get-preview-pdf?reportId=${reportId}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2em5uZXJyZ2FwcmNoYnVyZXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTAxNzUsImV4cCI6MjA3NDM2NjE3NX0._vuf_ZB8i-_GFDz2vIc_6y_6FzjeEkGTOKz90sxiEnY',
              },
            }
          );

          // Handle non-OK responses
          if (response.status === 404 || response.status === 202) {
            console.log('PDF file not ready yet, retrying...');
            if (!mounted) return;
            
            pdfDelay = Math.min(pdfDelay * 1.1, 5000);
            await new Promise(resolve => setTimeout(resolve, pdfDelay));
            poll();
            return;
          }

          // Parse JSON
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.log('JSON parse error, retrying...');
            if (!mounted) return;
            
            await new Promise(resolve => setTimeout(resolve, pdfDelay));
            poll();
            return;
          }

          // Handle "preparing" status
          if (data?.status === 'preparing') {
            console.log('PDF still preparing, retrying...');
            if (!mounted) return;
            
            pdfDelay = Math.min(pdfDelay * 1.1, 5000);
            await new Promise(resolve => setTimeout(resolve, pdfDelay));
            poll();
            return;
          }

          // Success case
          if (data?.previewUrl) {
            console.log('Preview URL received:', data.path);
            
            if (mounted) {
              setUrl(data.previewUrl);
              setDownloadUrl(data.previewUrl);
              setIsGenerating(false);
              setIsLoading(false);
              setIsPdfPollingActive(false);
              toast({
                title: "Preview ready!",
                description: "Your business plan preview is now available.",
              });
            }
          } else if (!response.ok) {
            throw new Error(data?.error || 'Failed to load preview');
          }
          
        } catch (error: any) {
          console.error('Error polling for PDF:', error);
          if (!mounted) return;
          
          await new Promise(resolve => setTimeout(resolve, pdfDelay));
          poll();
        }
      };

      poll();
    };

    pollForJobStatus();
    
    // Also start PDF polling if triggered by the parallel polling effect
    if (isPdfPollingActive && !url) {
      pollForPdfPreview();
    }
    
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
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">{loadingMessage}</h2>
              <p className="text-muted-foreground">This may take a few moments. Please don't close this page.</p>
              {jobStatus === 'processing' && (
                <p className="text-sm text-muted-foreground mt-2">Status: Processing your business plan...</p>
              )}
            </div>
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

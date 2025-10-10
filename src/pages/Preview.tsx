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
  const [userPlan, setUserPlan] = useState<string>("free");
  const [reportType, setReportType] = useState<string>("preview");

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
          .select('status, error_message, preview_pdf_path, full_pdf_path, completed_at')
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

        console.log('Job status:', job.status, 'Preview Path:', job.preview_pdf_path, 'Full Path:', job.full_pdf_path);
        if (mounted) {
          setJobStatus(job.status);
        }

        if (job.status === 'completed' && (job.preview_pdf_path || job.full_pdf_path)) {
          // Job is complete, fetch the PDF URL from job record
          console.log('Job completed, fetching PDF URL from job...');
          fetchReportFromJob();
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

    const fetchReportFromJob = async () => {
      if (url) {
        console.log('Report URL already set, skipping fetch');
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate(`/login?next=/preview/${reportId}`);
          return;
        }

        // Get user plan
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', session.user.id)
          .single();

        const plan = profile?.plan || 'free';
        if (mounted) {
          setUserPlan(plan);
        }

        // Get PDF URL from job record based on user plan
        const { data: job } = await supabase
          .from('jobs')
          .select('preview_pdf_path, full_pdf_path')
          .eq('report_id', reportId)
          .single();

        if (job) {
          const pdfUrl = plan === 'free' ? job.preview_pdf_path : job.full_pdf_path;
          console.log('PDF URL from job:', pdfUrl, 'for plan:', plan);
          
          if (pdfUrl && mounted) {
            setUrl(pdfUrl);
            setDownloadUrl(plan !== 'free' ? job.full_pdf_path : null);
            setReportType(plan === 'free' ? 'preview' : 'full');
            setIsGenerating(false);
            setIsLoading(false);
            setIsPdfPollingActive(false);
            toast({
              title: plan === 'free' ? "Preview Ready!" : "Full Report Ready!",
              description: plan === 'free' 
                ? "Your 2-page preview is ready. Upgrade to download the full plan." 
                : "Your complete business plan is now available.",
            });
          } else if (mounted) {
            console.log('No PDF URL available yet for plan:', plan);
          }
        }
      } catch (error: any) {
        console.error('Error fetching report from job:', error);
      }
    };

    pollForJobStatus();
    
    return () => {
      mounted = false;
    };
  }, [reportId, navigate, toast]);

  // Separate effect for parallel PDF fetching
  useEffect(() => {
    if (!isPdfPollingActive || url || !reportId) return;
    
    let mounted = true;

    const fetchReportParallel = async () => {
      if (url) {
        console.log('[Parallel] Report URL found, stopping');
        setIsPdfPollingActive(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !mounted) return;

        // Get user plan
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', session.user.id)
          .single();

        const plan = profile?.plan || 'free';
        if (mounted) {
          setUserPlan(plan);
        }

        console.log(`[Parallel] Checking for PDF URL in job for ${plan} user...`);

        // Get PDF URL from job record based on user plan
        const { data: job } = await supabase
          .from('jobs')
          .select('preview_pdf_path, full_pdf_path')
          .eq('report_id', reportId)
          .single();

        if (job && mounted) {
          const pdfUrl = plan === 'free' ? job.preview_pdf_path : job.full_pdf_path;
          console.log('[Parallel] PDF URL found in job:', pdfUrl, 'for plan:', plan);
          
          if (pdfUrl) {
            setUrl(pdfUrl);
            setDownloadUrl(plan !== 'free' ? job.full_pdf_path : null);
            setReportType(plan === 'free' ? 'preview' : 'full');
            setIsGenerating(false);
            setIsLoading(false);
            setIsPdfPollingActive(false);
            toast({
              title: plan === 'free' ? "Preview Ready!" : "Full Report Ready!",
              description: plan === 'free' 
                ? "Your 2-page preview is ready. Upgrade to download the full plan." 
                : "Your complete business plan is now available.",
            });
          }
        }
      } catch (error: any) {
        console.error('[Parallel] Error fetching report from job:', error);
      }
    };

    fetchReportParallel();
    
    return () => {
      mounted = false;
    };
  }, [isPdfPollingActive, reportId, url, navigate, toast]);

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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-foreground">
                {reportType === 'full' ? 'Business Plan' : 'Business Plan Preview (First 2 Pages)'}
              </h1>
              {userPlan === 'free' && reportType === 'preview' && (
                <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  Free Plan - Preview Only
                </span>
              )}
            </div>
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
        {userPlan === 'free' && url && (
          <Button
            variant="default"
            onClick={() => navigate('/pricing')}
            className="shadow-lg"
          >
            Upgrade to Download Full Plan
          </Button>
        )}
        {userPlan !== 'free' && downloadUrl && (
          <>
            <Button
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="shadow-lg"
            >
              Pricing
            </Button>
            <Button
              onClick={handleDownload}
              className="shadow-lg"
            >
              Download Full PDF
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

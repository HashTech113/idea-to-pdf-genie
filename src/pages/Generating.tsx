import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Generating() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const startGeneration = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please log in to generate your report.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Get the form data from sessionStorage
        const formDataStr = sessionStorage.getItem(`formData_${reportId}`);
        if (!formDataStr) {
          toast({
            title: "Error",
            description: "Form data not found. Please try again.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const formData = JSON.parse(formDataStr);

        setStatus("Starting generation...");
        setProgress(10);

        // Trigger business plan generation
        const response = await supabase.functions.invoke('generate-business-plan', {
          body: {
            ...formData,
            userId: session.user.id,
            reportId,
          },
        });

        if (response.error) {
          throw response.error;
        }

        setStatus("Generating your business plan...");
        setProgress(30);

        // Start polling for job status
        pollInterval = setInterval(async () => {
          const { data: job, error } = await supabase
            .from('jobs')
            .select('status, preview_pdf_path, error_message')
            .eq('report_id', reportId)
            .single();

          if (error) {
            console.error('Error checking job status:', error);
            return;
          }

          if (job?.status === 'completed' && job.preview_pdf_path) {
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            setProgress(100);
            setStatus("Complete!");
            
            // Clean up sessionStorage
            sessionStorage.removeItem(`formData_${reportId}`);
            
            // Navigate to preview
            setTimeout(() => {
              navigate(`/preview/${reportId}`, { replace: true });
            }, 500);
          } else if (job?.status === 'failed') {
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            toast({
              title: "Generation failed",
              description: job.error_message || "Failed to generate business plan. Please try again.",
              variant: "destructive",
            });
            setIsGenerating(false);
          }
        }, 3000); // Poll every 3 seconds

        // Simulate progress
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 90) return prev + 5;
            return prev;
          });
        }, 2000);

      } catch (error) {
        console.error('Error starting PDF generation:', error);
        toast({
          title: "Error",
          description: "Failed to start PDF generation. Please try again.",
          variant: "destructive",
        });
        setIsGenerating(false);
      }
    };

    startGeneration();

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, [reportId, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        <div className="space-y-6">
          <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            {progress === 100 ? (
              <CheckCircle2 className="w-16 h-16 text-primary" />
            ) : (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {progress === 100 ? "Business Plan Ready!" : "Generating Your Business Plan"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {status}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {progress}% complete
            </p>
          </div>

          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This may take 2-3 minutes. We're analyzing your business idea and creating a comprehensive plan.
          </p>
        </div>
      </div>

      {!isGenerating && (
        <div className="fixed bottom-6 right-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Go Home
          </Button>
        </div>
      )}
    </div>
  );
}

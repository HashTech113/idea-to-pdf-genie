import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Generating() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleViewPreview = async () => {
    try {
      setIsGenerating(true);
      
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

      // Trigger n8n to generate PDF
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

      // Navigate to preview page
      navigate(`/preview/${reportId}`);
      
    } catch (error) {
      console.error('Error starting PDF generation:', error);
      toast({
        title: "Error",
        description: "Failed to start PDF generation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Ready to Generate Your Business Plan
          </h1>
          <p className="text-muted-foreground text-lg">
            Click "View Preview" below to start generating your comprehensive business plan report.
          </p>
        </div>
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
          onClick={handleViewPreview}
          disabled={isGenerating}
          className="shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            'View Preview'
          )}
        </Button>
      </div>
    </div>
  );
}

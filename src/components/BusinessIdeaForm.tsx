import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const BusinessIdeaForm = () => {
  const [idea, setIdea] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idea.trim() || !location.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both your business idea and location.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://hashirceo.app.n8n.cloud/webhook-test/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: idea.trim(),
          location: location.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'business-idea.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: "Your business idea PDF has been generated and downloaded.",
      });

      // Reset form
      setIdea('');
      setLocation('');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="relative">
          {/* Glassmorphism card */}
          <div className="bg-glass-background backdrop-blur-glass border border-glass-border rounded-glass p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <h1 className="text-[1.8rem] font-bold text-center text-foreground mb-8">
                Business Idea Form
              </h1>

              {/* Business Idea Textarea */}
              <div className="space-y-2">
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Enter your business idea..."
                  className="min-h-[120px] bg-input border-glass-border text-foreground placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your location..."
                  className="bg-input border-glass-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  'Generate PDF'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10"></div>
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        {/* Modern solid card */}
        <div className="relative">
          <div className="bg-card border-2 border-primary/20 rounded-xl p-6 sm:p-8 lg:p-10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Modern title design */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full border border-primary/30 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg"></div>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  Business Idea Form
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                  Transform your innovative concept into a comprehensive business plan
                </p>
              </div>

              {/* Enhanced form fields */}
              <div className="space-y-6">
                {/* Business Idea Field */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-foreground tracking-wide">
                    <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                    Your Business Concept
                  </label>
                  <div className="relative">
                    <Textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="Describe your innovative business idea in detail..."
                      className="min-h-[160px] bg-input border-2 border-primary/20 text-foreground placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 rounded-xl hover:border-primary/30"
                      disabled={isLoading}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                      {idea.length}/500
                    </div>
                  </div>
                </div>

                {/* Location Field */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-semibold text-foreground tracking-wide">
                    <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                    Target Location
                  </label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State, or Region for your business launch"
                    className="bg-input border-2 border-primary/20 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 rounded-xl h-14 hover:border-primary/30"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Modern CTA Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full h-16 text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 text-primary-foreground rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-button)] hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 overflow-hidden"
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        <span className="animate-pulse">Generating Your PDF...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Business Plan PDF</span>
                        <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground pt-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Secure & Private
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Instant Download
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  AI-Powered
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
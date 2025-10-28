import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Shield, Zap, Star, ArrowRight, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getLatestPdfUrl, autoDownloadPdf } from "@/utils/pdfDownload";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const PricingSection = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();

  // Listen for payment success from Razorpay
  // Note: This postMessage integration requires Razorpay to be configured to send messages
  // For external Razorpay links, consider using a redirect URL callback instead
  useEffect(() => {
    const handlePaymentSuccess = async (event: MessageEvent) => {
      if (event.data?.type === "RAZORPAY_PAYMENT_SUCCESS") {
        const { razorpay_payment_id, plan_expiry_date } = event.data;
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch latest PDF and auto-download
          const pdfUrl = await getLatestPdfUrl(user.id);
          
          if (pdfUrl) {
            autoDownloadPdf(pdfUrl);
          }
          
          const expiryFormatted = plan_expiry_date 
            ? format(new Date(plan_expiry_date), "dd/MM/yyyy")
            : "next month";
          
          toast({
            title: "✅ Payment successful!",
            description: `Your Pro plan is active until ${expiryFormatted}. ${pdfUrl ? "Your full PDF is downloading now." : ""}`,
          });
        }
      } else if (event.data?.type === "RAZORPAY_PAYMENT_FAILED") {
        toast({
          title: "⚠️ Payment failed or canceled",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("message", handlePaymentSuccess);
    return () => window.removeEventListener("message", handlePaymentSuccess);
  }, [toast]);

  const handleSubscribe = () => {
    const url = "https://rzp.io/rzp/9S0U61Dk";
    setIsRedirecting(true);

    try {
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        window.location.replace(url);
      }
    } catch {
      window.location.replace(url);
    }

    setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.location.href = `${url}?t=${Date.now()}`;
      }
    }, 800);
  };

  const coreFeatures = [
    { icon: Zap, text: "5-minute insight delivery" },
    { icon: Users, text: "Unlimited seats for your team" },
    { icon: TrendingUp, text: "AI-powered research agent" },
  ];

  const proFeatures = [
    "Unlimited access to AI-powered research agent",
    "Priority 5-minute insight delivery",
    "Advanced audience filters & segmentation",
    "Verified B2B audience data",
    "Priority email support",
    "Export reports in multiple formats",
    "Custom branding options",
    "API access for integrations",
  ];

  const trustIndicators = [
    "Secure payment processing",
    "30-day money-back guarantee",
    "Cancel anytime",
    "No hidden fees",
  ];

  return (
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            🚀 World's 1st AI Market Research Agent
          </Badge>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Get Market Insights in <span className="text-primary">5 Minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Unlock unlimited access to AI-powered market research with verified B2B audiences
          </p>
        </div>

        {/* Core Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          {coreFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground text-left">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="border-2 border-primary/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent" />
            
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-primary text-primary-foreground px-6 py-1.5 shadow-lg">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Most Popular
              </Badge>
            </div>

            <div className="text-center pt-10 pb-4 px-6 relative">
              <h3 className="text-3xl font-bold text-foreground mb-2">Pro Plan</h3>
              <div className="mb-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl md:text-6xl font-bold text-foreground">INR 100</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Complete access to AI-powered market research with unlimited tokens and priority support.
              </p>

              <Button
                type="button"
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all mb-4 group"
                onClick={handleSubscribe}
                disabled={isRedirecting}
              >
                {isRedirecting ? (
                  "Redirecting to checkout..."
                ) : (
                  <>
                    Subscribe Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground mb-6">
                30-day money-back guarantee • Cancel anytime
              </p>
            </div>

            <div className="border-t border-border pt-6 px-6 pb-6">
              <h4 className="font-semibold text-foreground mb-4 text-center">Everything included:</h4>
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {trustIndicators.map((indicator, index) => (
            <div
              key={index}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-card border border-border"
            >
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground text-center">{indicator}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

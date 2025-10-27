import { Check, Shield, Zap, Users, TrendingUp, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const Pricing = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubscribe = () => {
    const url = "https://rzp.io/rzp/9S0U61Dk";
    setIsRedirecting(true);

    try {
      // Try opening in a new tab (works better in some in-app browsers)
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        // If blocked, replace current page so the old one isn't kept in history
        window.location.replace(url);
      }
    } catch {
      window.location.replace(url);
    }

    // Last-resort fallback in case the browser blocks both
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Market Research Agent</h2>
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" />
            Secure Checkout
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-8 max-w-5xl text-center">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          🚀 World's 1st AI Market Research Agent
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Get Market Insights in
          <span className="text-primary"> 5 Minutes</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Unlock unlimited access to AI-powered market research with verified B2B audiences. 
          Make data-driven decisions faster than ever.
        </p>

        {/* Core Features Grid */}
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
      </section>

      {/* Pricing Card */}
      <section className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary/30 shadow-2xl relative overflow-hidden">
            {/* Gradient Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent" />
            
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-primary text-primary-foreground px-6 py-1.5 shadow-lg">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Most Popular
              </Badge>
            </div>

            <CardHeader className="text-center pt-10 pb-4 relative">
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Pro Plan</CardTitle>
              <div className="mb-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl md:text-6xl font-bold text-foreground">INR 100 </span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
              </div>
              <CardDescription className="text-base leading-relaxed">
                Complete access to AI-powered market research with unlimited tokens and priority support.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              {/* CTA Button */}
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

              {/* Guarantee Text */}
              <p className="text-sm text-center text-muted-foreground mb-6">
                30-day money-back guarantee • Cancel anytime
              </p>

              {/* Features List */}
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-foreground mb-4 text-center">Everything included:</h3>
                <ul className="space-y-3">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
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
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Secure payment powered by Razorpay
          </p>
          <p className="text-xs text-muted-foreground">
            Questions? Contact our support team for assistance.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;

import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PricingSection } from "@/components/PricingSection";

const Pricing = () => {

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

      {/* Pricing Section */}
      <PricingSection />

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

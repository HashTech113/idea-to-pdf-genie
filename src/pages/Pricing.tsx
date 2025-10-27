import { useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Pricing = () => {
  const features = ["Unlimited seats", "Results in 5 minutes", "AI-powered insights with verified B2B audiences"];

  const proFeatures = [
    "Unlimited access to the AI-powered research agent",
    "5-minute insight delivery (priority)",
    "Advanced audience filters",
    "Priority email support",
  ];

  // Load Razorpay script once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    try {
      // Create order via Supabase Edge Function (Live)
      const res = await fetch("https://tvznnerrgaprchburewu.supabase.co/functions/v1/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10000 * 100 }), // INR in paise
      });

      const order = await res.json();

      const options = {
        key: "rzp_live_RYMUrImfeEQF84", // 🔑 Replace with your Razorpay Live Key ID
        amount: order.amount,
        currency: "INR",
        name: "Market Research Agent",
        description: "Pro Subscription (₹10000/month)",
        order_id: order.id,
        handler: async function (response: any) {
          // Verify payment
          await fetch("https://tvznnerrgaprchburewu.supabase.co/functions/v1/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          // Redirect to success page
          window.location.href = "/payment-success";
        },
        prefill: {
          name: "Your Customer",
          email: "customer@email.com",
          contact: "9999999999",
        },
        theme: {
          color: "#6366f1",
        },
      };

      const razor = new (window as any).Razorpay(options);
      razor.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong. Please try again.");
      // Optional fallback redirect
      // window.location.href = "https://razorpay.me/@kurumthazaaswin";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h2 className="text-xl font-semibold text-foreground">Market Research Agent</h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Subscription Pricing</h1>
          <p className="text-lg text-muted-foreground">World's 1st market research agent</p>
        </div>

        {/* Features List */}
        <div className="mb-12 max-w-md mx-auto">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="border-2 border-primary/20 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
            </div>

            <CardHeader className="text-center pt-8">
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Pro</CardTitle>
              <div className="mb-4">
                <span className="text-5xl font-bold text-foreground">₹10000</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="text-base">
                Unlock full access to the market research agent with unlimited AI insight tokens.
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                30-day money-back guarantee
              </p>
              <ul className="space-y-3 text-left mb-6">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button onClick={handlePayment} className="w-full" size="lg">
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Pricing;

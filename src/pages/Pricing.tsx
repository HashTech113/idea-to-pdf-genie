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
  return (
    <div className="min-h-screen bg-background">
      {" "}
      {/* Header */}{" "}
      <header className="border-b border-border">
        {" "}
        <div className="container mx-auto px-4 py-4">
          {" "}
          <h2 className="text-xl font-semibold text-foreground">Market Research Agent</h2>{" "}
        </div>{" "}
      </header>{" "}
      {/* Main Content */}{" "}
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {" "}
        <div className="text-center mb-12">
          {" "}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Subscription pricing</h1>{" "}
          <p className="text-lg text-muted-foreground">World's 1st market research agent</p>{" "}
        </div>{" "}
        {/* Features List */}{" "}
        <div className="mb-12 max-w-md mx-auto">
          {" "}
          <ul className="space-y-3">
            {" "}
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                {" "}
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  {" "}
                  <Check className="w-3 h-3 text-primary" />{" "}
                </div>{" "}
                <span className="text-foreground">{feature}</span>{" "}
              </li>
            ))}{" "}
          </ul>{" "}
        </div>{" "}
        {/* Pricing Card */}{" "}
        <div className="max-w-md mx-auto mb-12">
          {" "}
          <Card className="border-2 border-primary/20 shadow-lg relative">
            {" "}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              {" "}
              <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>{" "}
            </div>{" "}
            <CardHeader className="text-center pt-8">
              {" "}
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Pro</CardTitle>{" "}
              <div className="mb-4">
                {" "}
                <span className="text-5xl font-bold text-foreground">₹10000</span>{" "}
                <span className="text-muted-foreground">/month</span>{" "}
              </div>{" "}
              <CardDescription className="text-base">
                {" "}
                Unlock full access to the market research agent with unlimited AI insight tokens.{" "}
              </CardDescription>{" "}
            </CardHeader>{" "}
            <CardContent className="text-center">
              {" "}
              <p className="text-sm text-muted-foreground mb-6">30-day money-back guarantee — cancel anytime.</p>{" "}
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-semibold"
                onClick={() => (window.location.href = "https://rzp.io/rzp/TqlDyDU")}
              >
                {" "}
                Subscribe now →{" "}
              </Button>{" "}
            </CardContent>{" "}
            <CardFooter className="flex-col items-start border-t border-border pt-6">
              {" "}
              <h3 className="font-semibold text-foreground mb-4">What you get with Pro:</h3>{" "}
              <ul className="space-y-3 w-full">
                {" "}
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {" "}
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />{" "}
                    <span className="text-sm text-foreground">{feature}</span>{" "}
                  </li>
                ))}{" "}
              </ul>{" "}
            </CardFooter>{" "}
          </Card>{" "}
        </div>{" "}
        {/* Trust Elements */}{" "}
        <div className="text-center text-sm text-muted-foreground max-w-md mx-auto">
          {" "}
          <p>Secure payment processing. Cancel anytime with one click.</p>{" "}
        </div>{" "}
      </main>{" "}
    </div>
  );
};
export default Pricing;

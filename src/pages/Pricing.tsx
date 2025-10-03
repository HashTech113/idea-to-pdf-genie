import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const features = [
    "Unlimited downloads",
    "Results in 5 minutes",
    "AI-powered insights with verified B2B audiences",
  ];

  const comparisonData = [
    {
      feature: "Downloads from AI-powered research agent",
      free: "Limited",
      pro: "Unlimited",
    },
    {
      feature: "Insights delivery",
      free: "5 minutes",
      pro: "5 minutes",
    },
    {
      feature: "Audience targeting",
      free: "Basic",
      pro: "Advanced filters",
    },
    {
      feature: "Support",
      free: "Community access",
      pro: "Priority email support",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 px-4 text-center border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Subscription Pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            World's 1st market research agent
          </p>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-foreground">
                <Check className="w-5 h-5 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Link to="/business-plan">
            <Button size="lg" className="gap-2">
              <Zap className="w-5 h-5" />
              Try It Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Free Trial Card */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Free Trial</CardTitle>
                <CardDescription className="text-3xl font-bold text-foreground mt-2">
                  $0<span className="text-lg font-normal text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Get started with a free trial today.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span>Limited downloads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span>5-minute insights delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span>Basic audience targeting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span>Community support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/signup" className="w-full">
                  <Button variant="outline" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Pro Card */}
            <Card className="border-primary shadow-lg relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  Most Popular
                </span>
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription className="text-3xl font-bold text-foreground mt-2">
                  $10<span className="text-lg font-normal text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  Unlock full access to the market research agent with unlimited AI insight tokens.
                </p>
                <p className="text-sm text-primary mb-6 font-semibold">
                  30-day money-back guarantee — cancel anytime.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span className="font-semibold">Unlimited downloads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span>5-minute insights delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span className="font-semibold">Advanced audience filters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <span className="font-semibold">Priority email support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg">
                  Subscribe Now
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground text-center">
                Feature Comparison
              </h2>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center p-4 font-semibold text-foreground">Free Trial</th>
                    <th className="text-center p-4 font-semibold text-primary">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="p-4 text-foreground">{row.feature}</td>
                      <td className="p-4 text-center text-muted-foreground">{row.free}</td>
                      <td className="p-4 text-center font-semibold text-foreground">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stack */}
            <div className="md:hidden divide-y divide-border">
              {comparisonData.map((row, index) => (
                <div key={index} className="p-4">
                  <div className="font-semibold text-foreground mb-3">{row.feature}</div>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1">Free Trial</div>
                      <div className="text-foreground">{row.free}</div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-sm text-primary mb-1">Pro</div>
                      <div className="text-foreground font-semibold">{row.pro}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;

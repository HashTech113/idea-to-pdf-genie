import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Globe, Users, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Homepage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMakeBusinessPlan = async () => {
    try {
      // Create anonymous user
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        // If anonymous sign-in is disabled, show helpful message
        if (error.message?.includes('Anonymous') || error.message?.includes('anonymous')) {
          toast({
            title: "Setup Required",
            description: "Please enable anonymous sign-ins in your Supabase dashboard under Authentication > Providers",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }
      
      // Navigate to business plan form
      navigate('/business-plan');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen relative bg-white">
      {/* Animated Color Spread Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        {/* Light red color spread */}
        <div 
          className="absolute w-full h-full animate-color-spread-red"
          style={{
            background: 'radial-gradient(circle at 20% 30%, rgba(255, 182, 193, 0.3) 0%, transparent 50%)',
          }}
        ></div>
        {/* Light blue color spread */}
        <div 
          className="absolute w-full h-full animate-color-spread-blue"
          style={{
            background: 'radial-gradient(circle at 80% 70%, rgba(173, 216, 230, 0.3) 0%, transparent 50%)',
          }}
        ></div>
        {/* Additional flowing gradient */}
        <div 
          className="absolute w-full h-full animate-gradient-flow"
          style={{
            background: 'linear-gradient(45deg, rgba(255, 182, 193, 0.1) 0%, transparent 30%, rgba(173, 216, 230, 0.1) 70%, transparent 100%)',
          }}
        ></div>
      </div>
      
      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-normal font-poppins text-gray-900 mb-6">
              World's 1st Market Research Agent
            </h1>
            <p className="text-xl md:text-2xl font-poppins font-light text-gray-600 mb-8 max-w-3xl mx-auto">
              Get professional market research reports in minutes, powered by AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-black text-white hover:bg-gray-800 flex items-center justify-center border-none"
                onClick={handleMakeBusinessPlan}
              >
                Try It Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <div className="text-gray-700 text-lg font-medium px-4">or</div>
              
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-white text-black hover:bg-black hover:text-white flex items-center justify-center border-none"
                onClick={handleLogin}
              >
                Login if you already have an account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-4">1.</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Input Basic Business Information</h3>
                <p className="text-gray-600">
                  Enter your company name, industry, number of employees, and some basic financial or operational details.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600 mb-4">2.</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Generates Your Market Research Report</h3>
                <p className="text-gray-600">
                  Get a complete report in minutes—covering competitors, market trends, SWOT analysis, and more.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-600 mb-4">3.</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit & Customize Effortlessly</h3>
                <p className="text-gray-600">
                  Use our "Talk to Report" feature: tell the AI what you want changed, and it updates your report instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Who Is This For?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Entrepreneurs seeking investors</h3>
                <p className="text-gray-600">
                  Generate investor-ready market research reports designed to impress and secure funding.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business owners applying for loans</h3>
                <p className="text-gray-600">
                  Our reports follow bank-approved templates, ensuring credibility and compliance.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Anyone needing insights</h3>
                <p className="text-gray-600">
                  Perfect for research, projects, or self-learning—even if it's not for financial submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Key Benefits</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ultra-Fast Reports</h3>
                <p className="text-gray-600">
                  From start to finish in under 15 minutes.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Quality</h3>
                <p className="text-gray-600">
                  AI-generated reports follow proven templates and best practices.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Multilingual Support</h3>
                <p className="text-gray-600">
                  Generate reports in English, German, French, Spanish, Italian, Dutch, Japanese, Arabic, Korean, Portuguese, and more.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Data-Driven Insights</h3>
                <p className="text-gray-600">
                  AI leverages knowledge from the entire internet, business databases, and case studies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">What customers say about us</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of entrepreneurs who have successfully created professional business plans 
              using our AI-powered platform. Here's what they have to say:
            </p>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-gray-900 font-semibold">Zede H.</p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-gray-900 font-semibold">Jason C.</p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-gray-900 font-semibold">Parker A.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Subscription pricing
            </h2>
            <p className="text-lg text-gray-600">
              World's 1st market research agent
            </p>
          </div>

          {/* Features List */}
          <div className="mb-12 max-w-md mx-auto">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-gray-900">Unlimited seats</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-gray-900">Results in 5 minutes</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-gray-900">AI-powered insights with verified B2B audiences</span>
              </li>
            </ul>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-blue-200 shadow-lg relative bg-white">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
              
              <div className="text-center pt-8 px-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  Pro
                </h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">$10</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-base text-gray-600 mb-6">
                  Unlock full access to the market research agent with unlimited AI insight tokens.
                </p>
                
                <p className="text-sm text-gray-500 mb-6">
                  30-day money-back guarantee — cancel anytime.
                </p>
                
                <Button 
                  className="w-full bg-black text-white hover:bg-gray-800 h-12 text-lg font-semibold mb-6"
                  onClick={() => window.location.href = 'https://rzp.io/rzp/TqlDyDU'}
                >
                  Subscribe now →
                </Button>
              </div>

              <div className="flex-col items-start border-t border-gray-200 pt-6 px-6 pb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  What you get with Pro:
                </h3>
                <ul className="space-y-3 w-full">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-900">Unlimited access to the AI-powered research agent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-900">5-minute insight delivery (priority)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-900">Advanced audience filters</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-900">Priority email support</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Trust Elements */}
          <div className="text-center text-sm text-gray-500 max-w-md mx-auto mt-8">
            <p>Secure payment processing. Cancel anytime with one click.</p>
          </div>
        </div>
      </section>

      {/* Example AI-Generated Report Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Example AI-Generated Report</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h3>
                <p className="text-gray-600">
                  Our AI provides a detailed overview of your business, market opportunities, competitors, and strategic recommendations.
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Overview</h3>
                <p className="text-gray-600">
                  Understand your positioning, customer segments, and growth potential with clarity.
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Origins & Trends</h3>
                <p className="text-gray-600">
                  Identify historical trends and future growth projections for your industry.
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantage</h3>
                <p className="text-gray-600">
                  Discover how to differentiate your business and maximize market impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Why Choose Us?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Trusted by entrepreneurs worldwide</h3>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Featured in major media outlets</h3>
                <p className="text-gray-600">AP, Yahoo, MarketWatch, Bloomberg, Medium, and more</p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cutting-edge AI models</h3>
                <p className="text-gray-600">Uses GPT-3.5 & GPT-4 trained on extensive business data</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Final Call-to-Action Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-8 md:p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-poppins text-gray-900 mb-8">
              Start generating your AI-powered market research report in minutes!
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-black text-white hover:bg-gray-800 flex items-center justify-center"
                onClick={handleMakeBusinessPlan}
              >
                Try It Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <div className="text-gray-700 text-lg font-medium px-4">or</div>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-white border-black text-black hover:bg-black hover:text-white flex items-center justify-center"
                onClick={handleLogin}
              >
                Login if you already have an account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            Contact: help@15minuteplan.ai
          </p>
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-blue-600 hover:text-blue-800">Privacy & Refund Policies Apply</a>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 15 Minute Plan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
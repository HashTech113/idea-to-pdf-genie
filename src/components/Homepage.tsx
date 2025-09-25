import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Globe, Users, TrendingUp, Star } from "lucide-react";

const Homepage = () => {
  const navigate = useNavigate();

  const handleMakeBusinessPlan = () => {
    navigate('/business-plan');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            World's 1st Market Research Agent
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Fill out simple forms, select language, and get a business plan in under 15 minutes. Try It Out!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-72 h-14 text-lg bg-primary hover:bg-primary/90"
              onClick={handleMakeBusinessPlan}
            >
              Make business plan <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <div className="text-white text-lg font-medium px-4">or</div>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-72 h-14 text-lg bg-transparent border-primary text-primary hover:bg-primary hover:text-white"
              onClick={handleLogin}
            >
              Login if you've already made a plan
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-12">How it works?</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Our AI-powered platform guides you through a simple questionnaire to gather essential business information. 
            Using advanced market research algorithms, we analyze your inputs and generate a comprehensive, 
            professional business plan tailored to your specific needs and industry requirements.
          </p>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Who is this for?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-4">Entrepreneurs looking for investor funding</h3>
                <p className="text-gray-300">
                  Create investor-ready business plans with detailed market analysis, financial projections, 
                  and growth strategies that attract potential investors and venture capitalists.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-4">Business owners looking for a bank loan</h3>
                <p className="text-gray-300">
                  Generate comprehensive business plans with financial forecasts and risk assessments 
                  that meet banking requirements for loan applications and credit approvals.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-4">For anyone looking to make a business plan</h3>
                <p className="text-gray-300">
                  Whether you're starting a new venture, pivoting your business, or need strategic planning, 
                  our tool creates professional business plans for any purpose or industry.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-12">Our Process</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary mb-4">1.</div>
                <p className="text-lg text-gray-300">
                  Enter General Business Plan Information then a plan will be generated
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary mb-4">2.</div>
                <p className="text-lg text-gray-300">
                  Edit and Save
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-12">What customers say about us</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who have successfully created professional business plans 
            using our AI-powered platform. Here's what they have to say:
          </p>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Zede H.</p>
            </div>
            <div className="text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Jason C.</p>
            </div>
            <div className="text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Parker A.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mentions Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-12">Mentioned In..</h2>
          <div className="flex justify-center space-x-12 opacity-60">
            <div className="w-24 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Logo 1</span>
            </div>
            <div className="w-24 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Logo 2</span>
            </div>
            <div className="w-24 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Logo 3</span>
            </div>
          </div>
        </div>
      </section>

      {/* Example AI Generated Plan Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Example AI Generated Plan</h2>
          <Button variant="outline" className="mb-12 bg-transparent border-primary text-primary hover:bg-primary hover:text-white">
            View an example of our AI generated plan
          </Button>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Starter Plan</h3>
                <div className="space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pages:</span>
                    <span className="text-white">15-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Market Research:</span>
                    <span className="text-white">Basic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Financial Projections:</span>
                    <span className="text-white">3 Years</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Professional Plan</h3>
                <div className="space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pages:</span>
                    <span className="text-white">25-35</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Market Research:</span>
                    <span className="text-white">Comprehensive</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Financial Projections:</span>
                    <span className="text-white">5 Years</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Language Support Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-12">Language Support</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese'].map((language) => (
              <div key={language} className="bg-card/30 border border-primary/20 rounded-lg p-4">
                <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-white">{language}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Key Benefits</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">AI-Powered Efficiency</h3>
              <p className="text-gray-300">
                Our advanced AI algorithms analyze your business information and market data to generate 
                comprehensive business plans in minutes, not weeks. Save time and focus on what matters most - 
                growing your business.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">Professional Quality</h3>
              <p className="text-gray-300">
                Get investor-ready business plans that meet industry standards. Our AI incorporates best practices 
                from successful business plans and ensures your document is polished, professional, and persuasive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call-to-Action Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Create a professional business plan in just 15 minutes with our AI business plan generator
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-72 h-14 text-lg bg-primary hover:bg-primary/90"
              onClick={handleMakeBusinessPlan}
            >
              Make business plan <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <div className="text-white text-lg font-medium px-4">or</div>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-72 h-14 text-lg bg-transparent border-primary text-primary hover:bg-primary hover:text-white"
              onClick={handleLogin}
            >
              Login if you've already made a plan
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-12 px-4 border-t border-primary/20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-300 mb-4">
            Contact us: support@businessplanai.com
          </p>
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-primary hover:text-primary/80">Refund Policy</a>
            <a href="#" className="text-primary hover:text-primary/80">Privacy Policy</a>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Business Plan AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
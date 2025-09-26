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
    <div className="min-h-screen relative" style={{ backgroundColor: '#f7fafd' }}>
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        {/* Left sky blue blob */}
        <div 
          className="absolute w-96 h-96 rounded-full animate-drift-left"
          style={{
            backgroundColor: '#00A0FF',
            opacity: 0.4,
            filter: 'blur(150px)',
            left: '-10%',
            top: '20%'
          }}
        ></div>
        {/* Right coral red blob */}
        <div 
          className="absolute w-96 h-96 rounded-full animate-drift-right"
          style={{
            backgroundColor: '#FF5064',
            opacity: 0.4,
            filter: 'blur(150px)',
            right: '-10%',
            top: '30%'
          }}
        ></div>
      </div>
      
      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-normal font-poppins text-gray-900 mb-6">
              World's 1'st Market Research Agent
            </h1>
            <p className="text-xl md:text-2xl font-poppins font-light text-gray-600 mb-8 max-w-3xl mx-auto">
              Get comprehensive market research and insights in under 15 minutes. Try It Out!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-black text-white hover:bg-gray-800 flex items-center justify-center border-none"
                onClick={handleMakeBusinessPlan}
              >
                Make business plan <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <div className="text-gray-700 text-lg font-medium px-4">or</div>
              
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-white text-black hover:bg-black hover:text-white flex items-center justify-center border-none"
                onClick={handleLogin}
              >
                Login if you've already made a plan
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">How it works?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered business plan generator makes it simple to create professional business plans. 
              Just fill out our guided forms, select your preferred language, and receive a comprehensive 
              business plan tailored to your specific needs and industry.
            </p>
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Who is this for?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Entrepreneurs looking for investor funding</h3>
                <p className="text-gray-600">
                  Create compelling business plans that investors want to see. Our AI understands what 
                  venture capitalists and angel investors look for in a winning business proposal.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business owners and entrepreneurs looking for a bank loan</h3>
                <p className="text-gray-600">
                  Generate bank-ready business plans with detailed financial projections and market analysis 
                  that meet lending requirements and improve your loan approval chances.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For anyone looking to make a business plan</h3>
                <p className="text-gray-600">
                  Whether you're starting a new venture, expanding your business, or just need a roadmap 
                  for success, our AI creates comprehensive plans for any business goal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Our Process</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-4">1.</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Enter General Business Plan Information then a plan will be generated</h3>
                <p className="text-gray-600">
                  Fill out our simple forms with your business details, target market, and objectives. 
                  Our AI will then generate a comprehensive plan based on your input.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-pink-600 mb-4">2.</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit and Save</h3>
                <p className="text-gray-600">
                  Review your generated business plan, make any necessary edits, and save your final document. 
                  You can always come back to update it as your business evolves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
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

      {/* Mentions Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">Mentioned In..</h2>
            <div className="flex justify-center space-x-12 opacity-60">
              <div className="w-24 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-sm font-semibold">Logo 1</span>
              </div>
              <div className="w-24 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-sm font-semibold">Logo 2</span>
              </div>
              <div className="w-24 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-sm font-semibold">Logo 3</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example AI Generated Plan Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-8">Example AI Generated Plan</h2>
            <div className="text-center mb-12">
              <Button variant="outline" className="bg-white border-black text-black hover:bg-black hover:text-white">
                View an example of our AI generated plan
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Starter Plan</h3>
                <div className="space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages:</span>
                    <span className="text-gray-900">15-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market Research:</span>
                    <span className="text-gray-900">Basic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Financial Projections:</span>
                    <span className="text-gray-900">3 Years</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Professional Plan</h3>
                <div className="space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages:</span>
                    <span className="text-gray-900">25-35</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market Research:</span>
                    <span className="text-gray-900">Comprehensive</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Financial Projections:</span>
                    <span className="text-gray-900">5 Years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Language Support Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Language Support</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese'].map((language) => (
                <div key={language} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <Globe className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-900">{language}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Key Benefits</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI-Powered Efficiency</h3>
                <p className="text-gray-600">
                  Our advanced AI algorithms analyze your business information and market data to generate 
                  comprehensive business plans in minutes, not weeks. Save time and focus on what matters most - 
                  growing your business.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Professional Quality</h3>
                <p className="text-gray-600">
                  Get investor-ready business plans that meet industry standards. Our AI incorporates best practices 
                  from successful business plans and ensures your document is polished, professional, and persuasive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call-to-Action Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-poppins text-gray-900 mb-8">
              Create a professional business plan in just 15 minutes with our AI business plan generator
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-black text-white hover:bg-gray-800 flex items-center justify-center"
                onClick={handleMakeBusinessPlan}
              >
                Make business plan <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <div className="text-gray-700 text-lg font-medium px-4">or</div>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-72 h-14 text-base bg-white border-black text-black hover:bg-black hover:text-white flex items-center justify-center"
                onClick={handleLogin}
              >
                Login if you've already made a plan
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            Contact us: support@businessplanai.com
          </p>
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-blue-600 hover:text-blue-800">Refund Policy</a>
            <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 Business Plan AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  useEffect(() => {
    // If no email in state, redirect to signup
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Check your email</CardTitle>
          <CardDescription className="text-gray-600">
            We've sent a confirmation link to
          </CardDescription>
          <p className="text-sm font-medium text-gray-900 mt-2">{email}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Click the link in the email to confirm your account and complete your signup.
            </p>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p>Didn't receive the email?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>

          <Button 
            onClick={() => navigate('/signup')} 
            variant="outline"
            className="w-full"
          >
            Back to Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
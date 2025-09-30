import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const verificationSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  token: z.string().trim().min(6, { message: "Verification code must be at least 6 characters" })
});

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const stateData = location.state as { email?: string; password?: string } || {};
  
  const [formData, setFormData] = useState({
    email: stateData.email || '',
    token: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form data
    const validation = verificationSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://tvznnerrgaprchburewu.supabase.co/auth/v1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2em5uZXJyZ2FwcmNoYnVyZXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTAxNzUsImV4cCI6MjA3NDM2NjE3NX0._vuf_ZB8i-_GFDz2vIc_6y_6FzjeEkGTOKz90sxiEnY'
        },
        body: JSON.stringify({
          email: formData.email,
          token: formData.token,
          type: 'signup'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid verification code');
      }

      toast({
        title: "Account Verified!",
        description: "Your account has been successfully verified. Please log in.",
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
          <CardDescription className="text-gray-600">
            Enter the verification code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "border-red-500" : "border-gray-300"}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token" className="text-gray-700">Verification Code</Label>
              <Input
                id="token"
                name="token"
                type="text"
                value={formData.token}
                onChange={handleInputChange}
                className={errors.token ? "border-red-500" : "border-gray-300"}
                disabled={isLoading}
                placeholder="Enter 6-digit code"
              />
              {errors.token && (
                <p className="text-sm text-red-500">{errors.token}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-black text-white hover:bg-gray-800" 
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
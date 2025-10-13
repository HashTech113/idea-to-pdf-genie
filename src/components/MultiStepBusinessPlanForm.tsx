import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Step1Objective } from './steps/Step1Objective';
import { Step2BasicInfo } from './steps/Step2BasicInfo';
import { Step3CustomerGroups } from './steps/Step3CustomerGroups';
import { Step4ProductsServices } from './steps/Step4ProductsServices';
import { Step5SuccessDrivers } from './steps/Step5SuccessDrivers';
import { Step6Investment } from './steps/Step6Investment';
import { Step7Financial } from './steps/Step7Financial';
import { ProgressIndicator } from './ProgressIndicator';

export interface FormData {
  // Step 1
  privacyAccepted: boolean;
  businessType: string;
  planPurpose: string;
  planLanguage: string;
  
  // Step 2
  businessName: string;
  businessDescription: string;
  numberOfEmployees: string;
  customerLocation: string;
  offeringType: string;
  deliveryMethod: string;
  
  // Step 3
  customerGroups?: any;
  
  // Step 4
  productsServices?: any;
  
  // Step 5
  successDrivers?: any;
  weaknesses?: any;
  
  // Step 6
  investmentAmount?: string;
  fundingSource?: string;
  planCurrency?: string;
  investments?: any;
  
  // Step 7
  revenueProjection?: string;
  breakEvenTimeline?: string;
  firstYearRevenue?: string;
  yearlyGrowth?: string;
  operationsCosts?: any;
}

export const MultiStepBusinessPlanForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    privacyAccepted: false,
    businessType: '',
    planPurpose: '',
    planLanguage: '',
    businessName: '',
    businessDescription: '',
    numberOfEmployees: '',
    customerLocation: '',
    offeringType: '',
    deliveryMethod: '',
  });

  const updateData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate a unique report ID
      const reportId = crypto.randomUUID();

      // Insert job record
      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          id: reportId,
          user_id: user.id,
          status: 'processing',
          form_data: formData as any,
        });

      if (insertError) throw insertError;

      // Prepare n8n webhook URL
      const n8nUrl = 'https://salman.app.n8n.cloud/webhook/c78bfad0-5b5f-4a25-bfab-47c1cb6e6f26';

      // Send data to n8n
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          userId: user.id,
          formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger workflow');
      }

      // Navigate to generating page
      navigate(`/generating/${reportId}`);
      
      toast({
        title: "Success!",
        description: "Your business plan is being generated.",
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 7;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          {currentStep === 1 && (
            <Step1Objective
              data={formData}
              updateData={updateData}
              onNext={handleNext}
            />
          )}
          
          {currentStep === 2 && (
            <Step2BasicInfo
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
              onLogout={handleLogout}
              isLoading={isLoading}
            />
          )}
          
          {currentStep === 3 && (
            <Step3CustomerGroups
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          
          {currentStep === 4 && (
            <Step4ProductsServices
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          
          {currentStep === 5 && (
            <Step5SuccessDrivers
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          
          {currentStep === 6 && (
            <Step6Investment
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          
          {currentStep === 7 && (
            <Step7Financial
              data={formData}
              updateData={updateData}
              onPrev={handlePrev}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

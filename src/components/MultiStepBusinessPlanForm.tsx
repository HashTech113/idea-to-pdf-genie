import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Step2BasicInfo } from './steps/Step2BasicInfo';
import { supabase } from '@/integrations/supabase/client';

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
  customerGroups: Array<{
    description: string;
    incomeLevel: string;
  }>;
  
  // Step 4
  productsServices: Array<{
    name: string;
    description: string;
  }>;
  
  // Step 5
  successDrivers: string[];
  weaknesses: string[];
  
  // Step 6
  planCurrency: string;
  investments: Array<{
    item: string;
    amount: number;
  }>;
  
  // Step 7
  firstYearRevenue: string;
  yearlyGrowth: string;
  operationsCosts: Array<{
    category: string;
    percentage: number;
    amount: number;
  }>;
}

const initialFormData: FormData = {
  privacyAccepted: false,
  businessType: '',
  planPurpose: '',
  planLanguage: 'English',
  businessName: '',
  businessDescription: '',
  numberOfEmployees: '',
  customerLocation: '',
  offeringType: '',
  deliveryMethod: '',
  customerGroups: [{ description: '', incomeLevel: '' }],
  productsServices: [{ name: '', description: '' }],
  successDrivers: ['', '', ''],
  weaknesses: ['', '', ''],
  planCurrency: 'USD',
  investments: [{ item: '', amount: 0 }],
  firstYearRevenue: '',
  yearlyGrowth: '',
  operationsCosts: []
};

export const MultiStepBusinessPlanForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const totalSteps = 1;

  const updateFormData = (stepData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const submitForm = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-plan', {
        body: formData,
      });

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Generation failed",
          description: error.message || "Failed to generate Business Plan",
          variant: "destructive"
        });
        return;
      }

      // data is already a blob from the edge function
      const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data)], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'business-plan.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: "Your business plan PDF has been generated and downloaded.",
      });

      // Reset form
      setFormData(initialFormData);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error generating Business Plan:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    return (
      <Step2BasicInfo
        data={formData}
        updateData={updateFormData}
        onNext={submitForm}
        onPrev={() => {}} // No previous step
        isLoading={isLoading}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Form Card */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 lg:p-10 border border-border" style={{ boxShadow: 'var(--shadow-large)' }}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
};
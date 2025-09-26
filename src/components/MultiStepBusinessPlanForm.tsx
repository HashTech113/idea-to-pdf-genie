import { useState } from 'react';
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

  const totalSteps = 7;

  const updateFormData = (stepData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitForm = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://hashirceo.app.n8n.cloud/webhook-test/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Business Plan');
      }

      const blob = await response.blob();
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
      alert('Error generating Business Plan');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Objective
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <Step2BasicInfo
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <Step3CustomerGroups
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <Step4ProductsServices
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <Step5SuccessDrivers
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <Step6Investment
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 7:
        return (
          <Step7Financial
            data={formData}
            updateData={updateFormData}
            onSubmit={submitForm}
            onPrev={prevStep}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden" style={{ backgroundColor: '#f7fafd' }}>
      {/* Floating color blobs */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        {/* Sky blue blob - left side */}
        <div 
          className="absolute w-96 h-96 rounded-full animate-drift-left"
          style={{
            background: '#00A0FF',
            opacity: 0.4,
            filter: 'blur(150px)',
            left: '10%',
            top: '20%'
          }}
        ></div>
        {/* Coral red blob - right side */}
        <div 
          className="absolute w-80 h-80 rounded-full animate-drift-right"
          style={{
            background: '#FF5064',
            opacity: 0.4,
            filter: 'blur(150px)',
            right: '15%',
            top: '30%'
          }}
        ></div>
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
        
        {/* Form Card */}
        <div className="bg-card border-2 border-primary/20 rounded-xl p-6 sm:p-8 lg:p-10 shadow-2xl mt-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};
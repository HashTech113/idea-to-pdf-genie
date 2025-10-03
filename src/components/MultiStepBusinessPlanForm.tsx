import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Step2BasicInfo } from './steps/Step2BasicInfo';
import { PreviewModal } from './PreviewModal';

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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const totalSteps = 1;

  const updateFormData = (stepData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const sanitizePdfUrl = (blobOrText: Blob): string | null => {
    // If it's a valid PDF blob, create URL
    if (blobOrText.type === 'application/pdf' && blobOrText.size > 0) {
      return window.URL.createObjectURL(blobOrText);
    }
    
    // Fallback: try to read as text and extract valid URL
    // (handles case where n8n returns malformed URL string)
    return null;
  };

  const submitForm = async () => {
    setIsLoading(true);

    // 30s client-side timeout to avoid hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch('https://tvznnerrgaprchburewu.supabase.co/functions/v1/generate-business-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      // If the edge function failed, surface its error text
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Generate failed (${response.status}): ${text || 'No error message'}`);
      }

      // Expect a PDF; sanitize and create blob URL for preview
      const blob = await response.blob();
      const url = sanitizePdfUrl(blob);
      
      if (!url) {
        throw new Error('Invalid PDF response from server');
      }
      
      setPdfUrl(url);
      
      toast({
        title: "Success!",
        description: "Your business plan preview is ready.",
      });

      // Show preview modal instead of downloading
      setShowPreviewModal(true);
    } catch (error: any) {
      console.error('Error generating Business Plan:', error);
      
      // Show detailed error message
      const errorMessage = error?.message ?? 'Request failed or timed out';
      toast({
        title: 'Error generating Business Plan',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      clearTimeout(timeout);
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
    <>
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Form Card */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 lg:p-10 border border-border" style={{ boxShadow: 'var(--shadow-large)' }}>
            {renderStep()}
          </div>
        </div>
      </div>

      <PreviewModal 
        open={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)}
        pdfUrl={pdfUrl}
      />
    </>
  );
};
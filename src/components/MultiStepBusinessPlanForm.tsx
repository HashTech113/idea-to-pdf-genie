import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Step2BasicInfo } from './steps/Step2BasicInfo';
import { PreviewModal } from './PreviewModal';
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPaidUser, setIsPaidUser] = useState(false);
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

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to generate a business plan');
      }

      // Step 1: Generate PDF via n8n webhook (stores in Supabase Storage)
      const generateResponse = await fetch('https://tvznnerrgaprchburewu.supabase.co/functions/v1/generate-business-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!generateResponse.ok) {
        const text = await generateResponse.text().catch(() => '');
        throw new Error(`Generate failed (${generateResponse.status}): ${text || 'No error message'}`);
      }

      // Get reportId from n8n response (assuming it returns { reportId: "..." })
      const { reportId } = await generateResponse.json();
      if (!reportId) {
        throw new Error('No reportId returned from generation');
      }

      // Step 2: Call get-report to retrieve plan-based access
      const reportResponse = await fetch(
        `https://tvznnerrgaprchburewu.supabase.co/functions/v1/get-report?reportId=${reportId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!reportResponse.ok) {
        throw new Error('Failed to retrieve report');
      }

      const contentType = reportResponse.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        // Pro user: response is JSON with signed URL
        const reportData = await reportResponse.json();
        const pdfResponse = await fetch(reportData.url);
        const pdfBlob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setIsPaidUser(true);
      } else {
        // Free user: response is the preview PDF binary
        const blob = await reportResponse.blob();
        const url = sanitizePdfUrl(blob);
        if (!url) {
          throw new Error('Invalid PDF response from server');
        }
        setPdfUrl(url);
        setIsPaidUser(false);
      }

      toast({
        title: "Success!",
        description: "Your business plan is ready.",
      });

      setShowPreviewModal(true);
    } catch (error: any) {
      console.error('Error generating Business Plan:', error);
      
      const errorMessage = error?.message ?? 'Request failed or timed out';
      toast({
        title: 'Error generating Business Plan',
        description: errorMessage,
        variant: 'destructive',
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
        isPaidUser={isPaidUser}
      />
    </>
  );
};
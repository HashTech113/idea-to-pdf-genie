import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Step2BasicInfo } from './steps/Step2BasicInfo';
import { PreviewModal } from './PreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

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
  const [reportType, setReportType] = useState<'preview' | 'full'>('preview');
  const { toast } = useToast();

  const totalSteps = 1;

  const updateFormData = (stepData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const pollJobStatus = async (jobId: string, accessToken: string): Promise<string> => {
    const maxAttempts = 60; // 3 minutes max (60 * 3s)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetchWithTimeout(
          `https://tvznnerrgaprchburewu.supabase.co/functions/v1/job-status?jobId=${jobId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          },
          10000 // 10s timeout per poll
        );

        if (!response.ok) {
          throw new Error(`Failed to check job status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Job status:', result.status);

        if (result.status === 'done') {
          if (!result.reportId) {
            throw new Error('Job completed but no reportId returned');
          }
          return result.reportId;
        }

        if (result.status === 'failed') {
          throw new Error(result.errorMessage || 'Job failed');
        }

        // Still processing, wait 3s and try again
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      } catch (error) {
        console.error('Error polling job status:', error);
        throw error;
      }
    }

    throw new Error('Job timed out after 3 minutes');
  };

  const submitForm = async () => {
    setIsLoading(true);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to generate a business plan');
      }

      // Submit job to generate-business-plan
      const submitResponse = await fetchWithTimeout(
        'https://tvznnerrgaprchburewu.supabase.co/functions/v1/generate-business-plan',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
        120000 // 2 minute timeout
      );

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text().catch(() => '');
        throw new Error(`Failed to submit job: ${errorText || submitResponse.statusText}`);
      }

      const { jobId } = await submitResponse.json();
      console.log('Job submitted:', jobId);

      toast({
        title: "Processing...",
        description: "Your business plan is being generated. This may take a few minutes.",
      });

      // Poll for job completion
      const reportId = await pollJobStatus(jobId, session.access_token);
      console.log('Job completed, reportId:', reportId);

      // Get the report (preview or full based on user plan)
      const reportResponse = await fetchWithTimeout(
        `https://tvznnerrgaprchburewu.supabase.co/functions/v1/get-report?reportId=${reportId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        },
        30000 // 30s timeout
      );

      if (!reportResponse.ok) {
        throw new Error('Failed to retrieve report');
      }

      const reportData = await reportResponse.json();
      console.log('Report data:', reportData);

      setPdfUrl(reportData.url);
      setReportType(reportData.type);
      
      toast({
        title: "Success!",
        description: reportData.type === 'preview' 
          ? "Your business plan preview is ready." 
          : "Your full business plan is ready.",
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
        reportType={reportType}
      />
    </>
  );
};
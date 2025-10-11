import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Step2BasicInfo } from './steps/Step2BasicInfo';
import { Loader2 } from 'lucide-react';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 1;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate('/');
    } else {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (stepData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };


  const submitForm = async () => {
    setIsGenerating(true);
    
    try {
      const n8nUrl = 'https://hashirceo.app.n8n.cloud/webhook/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f';
      
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-' + Date.now(),
          reportId: 'report-' + Date.now(),
          formData: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const data = await response.json();
      
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        toast({
          title: "PDF Generated!",
          description: "Your business plan is ready to view.",
        });
      } else {
        throw new Error('No PDF URL in response');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    return (
      <Step2BasicInfo
        data={formData}
        updateData={updateFormData}
        onNext={submitForm}
        onPrev={() => {}} // No previous step
        onLogout={handleLogout}
        isLoading={isGenerating}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Form Card */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 lg:p-10 border border-border" style={{ boxShadow: 'var(--shadow-large)' }}>
          {renderStep()}
        </div>

        {/* Loading State */}
        {isGenerating && !pdfUrl && (
          <div className="bg-card rounded-2xl p-8 border border-border flex flex-col items-center justify-center space-y-4" style={{ boxShadow: 'var(--shadow-large)' }}>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-foreground font-medium">Loading PDF preview…</p>
            <p className="text-muted-foreground text-sm">This may take a moment</p>
          </div>
        )}

        {/* PDF Preview */}
        {pdfUrl && (
          <div className="bg-card rounded-2xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-large)' }}>
            <iframe
              src={pdfUrl}
              className="w-full rounded-xl"
              style={{ 
                height: '700px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
              title="Business Plan PDF Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};
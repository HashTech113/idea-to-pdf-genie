import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LogOut, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MultiStepBusinessPlanForm = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    numberOfEmployees: '',
    customerLocation: '',
    offeringType: '',
    deliveryMethod: ''
  });

  const [errors, setErrors] = useState<{
    businessName?: string;
    businessDescription?: string;
    numberOfEmployees?: string;
    customerLocation?: string;
    offeringType?: string;
    deliveryMethod?: string;
    submit?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [jobStatus, setJobStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const updateData = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const validate = () => {
    const newErrors: {
      businessName?: string;
      businessDescription?: string;
      numberOfEmployees?: string;
      customerLocation?: string;
      offeringType?: string;
      deliveryMethod?: string;
      submit?: string;
    } = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = 'Business description is required';
    }
    if (!formData.numberOfEmployees) {
      newErrors.numberOfEmployees = 'Number of employees is required';
    }
    if (!formData.customerLocation.trim()) {
      newErrors.customerLocation = 'Customer location is required';
    }
    if (!formData.offeringType) {
      newErrors.offeringType = 'Please select offering type';
    }
    if (!formData.deliveryMethod) {
      newErrors.deliveryMethod = 'Please select delivery method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Poll job status
  useEffect(() => {
    if (currentReportId && (jobStatus === 'pending' || jobStatus === 'processing')) {
      const pollJobStatus = async () => {
        const { data, error } = await supabase
          .from('jobs')
          .select('status, pdf_path, preview_pdf_path, full_pdf_path, error_message')
          .eq('report_id', currentReportId)
          .single();

        if (error) {
          console.error('Error polling job status:', error);
          return;
        }

        if (data) {
          console.log('Job status update:', data.status);
          setJobStatus(data.status as any);

          if (data.status === 'completed') {
            // Clear polling interval
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Use preview_pdf_path if available, otherwise fallback to pdf_path
            const pdfPath = data.preview_pdf_path || data.pdf_path;
            
            if (pdfPath) {
              // Get public URL from storage
              const { data: urlData } = supabase.storage
                .from('business-plans')
                .getPublicUrl(pdfPath);
              
              setPdfUrl(urlData.publicUrl);
              setShowPreview(true);
              setIsLoading(false);
              
              toast({
                title: "Success!",
                description: "Your business plan is ready.",
              });
            }
          } else if (data.status === 'failed') {
            // Clear polling interval
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setIsLoading(false);
            setErrors({ submit: data.error_message || 'PDF generation failed. Please try again.' });
            
            toast({
              title: "Error",
              description: data.error_message || 'PDF generation failed.',
              variant: "destructive",
            });
          }
        }
      };

      // Poll immediately
      pollJobStatus();

      // Then poll every 5 seconds
      pollingIntervalRef.current = setInterval(pollJobStatus, 5000);

      // Cleanup on unmount
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [currentReportId, jobStatus, toast]);

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setErrors({ submit: 'You must be logged in to generate a business plan' });
        setIsLoading(false);
        return;
      }

      // Generate a unique report ID
      const reportId = crypto.randomUUID();
      setCurrentReportId(reportId);
      setJobStatus('pending');

      console.log('Creating job with reportId:', reportId);

      // Insert job record in database
      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          report_id: reportId,
          user_id: user.id,
          status: 'pending',
          form_data: formData,
        });

      if (insertError) {
        throw new Error(`Failed to create job: ${insertError.message}`);
      }

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-business-plan', {
        body: {
          userId: user.id,
          reportId,
          ...formData,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to trigger PDF generation');
      }

      console.log('Edge function response:', data);

      toast({
        title: "Processing...",
        description: "Your business plan is being generated. This may take a few minutes.",
      });

      // The polling will handle the rest
    } catch (error: any) {
      console.error('Full error:', error);
      setJobStatus('idle');
      setCurrentReportId(null);
      setIsLoading(false);
      setErrors({
        submit: error.message || 'Failed to generate business plan. Please try again.'
      });
      
      toast({
        title: "Error",
        description: error.message || 'Failed to start PDF generation.',
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout clicked');
  };

  const handleBack = () => {
    setShowPreview(false);
    setPdfUrl('');
    setJobStatus('idle');
    setCurrentReportId(null);
  };

  if (showPreview && pdfUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Your Business Plan
              </h2>
              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  variant="outline"
                  className="gap-2"
                >
                  Open in New Tab
                </Button>
                <Button
                  onClick={handleBack}
                  variant="outline"
                >
                  Back to Form
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Business Plan Preview"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Basic Business Information
            </h2>
            <p className="text-gray-600 text-sm">
              Tell us about your business fundamentals
            </p>
          </div>

          <div className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Business Name *
              </Label>
              <Input
                value={formData.businessName}
                onChange={(e) => updateData({ businessName: e.target.value })}
                placeholder="Enter your business name"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.businessName && (
                <p className="text-red-500 text-xs">{errors.businessName}</p>
              )}
            </div>

            {/* Business Description */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Business Description *
              </Label>
              <Textarea
                value={formData.businessDescription}
                onChange={(e) => updateData({ businessDescription: e.target.value })}
                placeholder="Describe what your business does..."
                className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.businessDescription && (
                <p className="text-red-500 text-xs">{errors.businessDescription}</p>
              )}
            </div>

            {/* Number of Employees */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Number of Employees *
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.numberOfEmployees}
                onChange={(e) => updateData({ numberOfEmployees: e.target.value })}
                placeholder="0"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.numberOfEmployees && (
                <p className="text-red-500 text-xs">{errors.numberOfEmployees}</p>
              )}
            </div>

            {/* Customer Location */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Where do you serve customers? *
              </Label>
              <Input
                value={formData.customerLocation}
                onChange={(e) => updateData({ customerLocation: e.target.value })}
                placeholder="e.g., Local, Regional, National, Global"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.customerLocation && (
                <p className="text-red-500 text-xs">{errors.customerLocation}</p>
              )}
            </div>

            {/* Product or Service */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Do you offer products or services? *
              </Label>
              <RadioGroup
                value={formData.offeringType}
                onValueChange={(value) => updateData({ offeringType: value })}
                className="grid grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <RadioGroupItem value="products" id="products" />
                  <Label htmlFor="products" className="cursor-pointer font-medium">Products</Label>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <RadioGroupItem value="services" id="services" />
                  <Label htmlFor="services" className="cursor-pointer font-medium">Services</Label>
                </div>
              </RadioGroup>
              {errors.offeringType && (
                <p className="text-red-500 text-xs">{errors.offeringType}</p>
              )}
            </div>

            {/* Delivery Method */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                How do customers get your {formData.offeringType || 'products/services'}? *
              </Label>
              <RadioGroup
                value={formData.deliveryMethod}
                onValueChange={(value) => updateData({ deliveryMethod: value })}
                className="grid grid-cols-1 gap-3"
              >
                {[
                  { value: 'physical-store', label: 'Physical Store/Location' },
                  { value: 'online', label: 'Online/Digital Delivery' },
                  { value: 'hybrid', label: 'Both Physical and Online' },
                  { value: 'direct-sales', label: 'Direct Sales/Field Service' }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.deliveryMethod && (
                <p className="text-red-500 text-xs">{errors.deliveryMethod}</p>
              )}
            </div>
          </div>

          {/* Processing Status */}
          {(jobStatus === 'pending' || jobStatus === 'processing') && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div>
                  <p className="font-semibold">
                    {jobStatus === 'pending' ? 'Queued' : 'Generating PDF...'}
                  </p>
                  <p className="text-sm mt-1">
                    Your business plan is being generated. This may take a few minutes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p className="text-sm mt-1">{errors.submit}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Generating Business Plan...
                </>
              ) : (
                'Generate Business Plan'
              )}
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 gap-2 border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepBusinessPlanForm;

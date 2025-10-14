import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LogOut, Loader2, FileText } from 'lucide-react';

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

  const [useCorsProxy, setUseCorsProxy] = useState(false);

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    console.log('Sending data:', formData);

    // Production webhook URL
    const webhookUrl = 'https://hashirceo.app.n8n.cloud/webhook/generate-pdf';

    // Use CORS proxy if enabled (for testing only)
    const finalUrl = useCorsProxy
      ? `https://corsproxy.io/?${encodeURIComponent(webhookUrl)}`
      : webhookUrl;

    try {
      const response = await fetch(finalUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Try to get response even if status is not OK
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response:', data);
      } catch (e) {
        // If response is not JSON, treat it as plain text URL
        data = responseText;
        console.log('Response is plain text:', data);
      }

      // Check if we got an error response
      if (!response.ok) {
        // Check if the error response contains a PDF URL despite the error
        if (typeof data === 'object' && (data.pdfUrl || data.url)) {
          console.log('Got PDF URL despite error status');
          // Continue to extract URL
        } else {
          throw new Error(`Server error (${response.status}): ${typeof data === 'object' ? data.message : responseText}`);
        }
      }

      // Extract PDF URL from response - try multiple possible structures
      let url = null;

      if (typeof data === 'string') {
        // Check if it's a URL string
        if (data.startsWith('http')) {
          url = data;
        }
      } else if (data.pdfUrl) {
        url = data.pdfUrl;
      } else if (data.url) {
        url = data.url;
      } else if (data.pdf) {
        url = data.pdf;
      } else if (data.fileUrl) {
        url = data.fileUrl;
      } else if (data['pdf url']) {
        url = data['pdf url'];
      } else if (data.pdfurl) {
        url = data.pdfurl;
      } else if (data.data && typeof data.data === 'object') {
        // Check nested data object
        url = data.data.pdfUrl || data.data.url || data.data.pdf || data.data['pdf url'];
      }

      // Check if URL is still a template literal (n8n configuration issue)
      if (url && typeof url === 'string' && url.includes('={{') && url.includes('}}')) {
        throw new Error('n8n workflow error: The PDF URL field is not configured correctly. In the "Respond to Webhook1" node, change the responseBody field to Expression mode and use: { "pdfUrl": {{ $json.pdfurl }} } (without quotes around the expression)');
      }

      console.log('Extracted URL:', url);

      if (url && typeof url === 'string' && (url.includes('.pdf') || url.includes('supabase'))) {
        setPdfUrl(url);
        setShowPreview(true);
      } else {
        throw new Error('Invalid or missing PDF URL in response. Full response: ' + JSON.stringify(data).substring(0, 200));
      }
    } catch (error: any) {
      console.error('Full error:', error);
      setErrors({
        submit: error.message || 'Failed to generate business plan. Please try again. Check console for details.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout clicked');
  };

  const handleBack = () => {
    setShowPreview(false);
    setPdfUrl('');
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

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p className="text-sm mt-1">{errors.submit}</p>
              {errors.submit.includes('access-control-allow-origin') && (
                <div className="mt-3 pt-3 border-t border-red-300">
                  <p className="text-xs font-semibold mb-2">This is a CORS error from the n8n webhook.</p>
                  <button
                    onClick={() => setUseCorsProxy(!useCorsProxy)}
                    className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                  >
                    {useCorsProxy ? '✓ Using CORS Proxy' : 'Try CORS Proxy (Testing Only)'}
                  </button>
                  <p className="text-xs mt-2 text-red-600">
                    <strong>Permanent Fix Required:</strong> Update your n8n workflow's "Respond to Webhook" node to fix the header name (remove the extra space).
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* CORS Proxy Toggle - Always visible */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">CORS Proxy</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Enable this if you get CORS errors. This routes the request through a proxy.
                  </p>
                </div>
                <button
                  onClick={() => setUseCorsProxy(!useCorsProxy)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${useCorsProxy
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {useCorsProxy ? '✓ Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

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

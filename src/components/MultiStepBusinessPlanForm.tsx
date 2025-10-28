import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LogOut, Loader2, FileText, Download, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Document, Page, pdfjs } from "react-pdf";
import { autoDownloadPdf } from "@/utils/pdfDownload";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const MultiStepBusinessPlanForm = () => {
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    numberOfEmployees: "",
    customerLocation: "",
    offeringType: "",
    deliveryMethod: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "pro">("free");
  const [numPages, setNumPages] = useState<number>(0);
  const [isPolling, setIsPolling] = useState(false);
  const [submittedBusinessIdea, setSubmittedBusinessIdea] = useState("");
  const [submittedLocation, setSubmittedLocation] = useState("");
  const fallbackPollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user plan on mount
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("plan, role").eq("user_id", user.id).single();
          if (profile) {
            setUserPlan(profile.plan as "free" | "pro");
            
            // Auto-download PDF for subscribed_user and admin on first load
            if (pdfUrl && (profile.role === "subscribed_user" || profile.role === "admin") && !showPreview) {
              setTimeout(() => {
                autoDownloadPdf(pdfUrl);
              }, 1000);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      }
    };
    fetchUserPlan();
  }, [pdfUrl, showPreview]);

  const updateData = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = "Business description is required";
    }
    if (!formData.numberOfEmployees) {
      newErrors.numberOfEmployees = "Number of employees is required";
    }
    if (!formData.customerLocation.trim()) {
      newErrors.customerLocation = "Customer location is required";
    }
    if (!formData.offeringType) {
      newErrors.offeringType = "Please select offering type";
    }
    if (!formData.deliveryMethod) {
      newErrors.deliveryMethod = "Please select delivery method";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Setup realtime subscription and polling
  useEffect(() => {
    if (!isPolling) return;

    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrors({ submit: "User session lost. Please log in again." });
        setIsPolling(false);
        return;
      }

      console.log("Setting up realtime subscription for user:", user.id);

      // Setup realtime subscription - listen for INSERT events with this user_id
      const channel = supabase
        .channel(`pdf-updates-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_business",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            console.log("Realtime INSERT received:", payload.new);
            // Check if this matches the submitted business idea and location
            const matchesBusiness = payload.new?.business_idea === submittedBusinessIdea;
            const matchesLocation = payload.new?.location === submittedLocation;

            if (payload.new?.pdf_url && matchesBusiness && matchesLocation) {
              console.log("PDF URL found via realtime:", payload.new.pdf_url);
              setPdfUrl(payload.new.pdf_url);
              setShowPreview(true);
              setIsPolling(false);
              setIsLoading(false);

              // Cleanup
              if (fallbackPollingRef.current) clearInterval(fallbackPollingRef.current);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
              }

              toast({
                title: "Business Plan Ready!",
                description: "Your business plan has been generated successfully.",
              });
            }
          },
        )
        .subscribe();

      realtimeChannelRef.current = channel;

      // Fallback polling after 30 seconds
      const fallbackTimeout = setTimeout(async () => {
        console.log("Starting fallback polling for user:", user.id);
        const pollInterval = setInterval(async () => {
          try {
            console.log("Polling database for business_idea:", submittedBusinessIdea, "location:", submittedLocation);
            // Query with filters for business_idea and location
            const { data, error } = await supabase
              .from("user_business")
              .select("pdf_url, business_idea, location, created_at")
              .eq("user_id", user.id)
              .eq("business_idea", submittedBusinessIdea)
              .eq("location", submittedLocation)
              .not("pdf_url", "is", null)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (error) {
              if (error.code !== "PGRST116") {
                console.error("Polling error:", error);
              }
              return;
            }

            if (data?.pdf_url) {
              console.log("PDF found via polling:", data.pdf_url);
              setPdfUrl(data.pdf_url);
              setShowPreview(true);
              setIsPolling(false);
              setIsLoading(false);

              // Cleanup
              clearInterval(pollInterval);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
              }

              toast({
                title: "Business Plan Ready!",
                description: "Your business plan has been generated successfully.",
              });
            }
          } catch (error) {
            console.error("Polling fetch error:", error);
          }
        }, 5000); // Poll every 5 seconds

        fallbackPollingRef.current = pollInterval;
      }, 30000); // Wait 30 seconds before starting polling

      // 10-minute timeout
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setIsPolling(false);
        if (fallbackPollingRef.current) clearInterval(fallbackPollingRef.current);
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
        }

        setErrors({
          submit: "PDF generation is taking too long. Please try again.",
        });

        toast({
          title: "Timeout",
          description: "PDF generation exceeded maximum wait time.",
          variant: "destructive",
        });
      }, 600000); // 10 minutes

      return () => {
        if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
        if (fallbackPollingRef.current) clearInterval(fallbackPollingRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        clearTimeout(fallbackTimeout);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, [isPolling, toast, submittedBusinessIdea, submittedLocation]);

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrors({ submit: "You must be logged in to generate a business plan" });
      setIsLoading(false);
      return;
    }

    console.log("Current user ID:", user.id);

    // Store submitted values for polling comparison
    setSubmittedBusinessIdea(formData.businessDescription);
    setSubmittedLocation(formData.customerLocation);

    const dataToSend = {
      userId: user.id,
      businessName: formData.businessName,
      businessDescription: formData.businessDescription,
      numberOfEmployees: formData.numberOfEmployees,
      customerLocation: formData.customerLocation,
    };

    console.log("Sending data to webhook:", dataToSend);

    const webhookUrl = "https://hashirceo.app.n8n.cloud/webhook/generate-pdf";

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      console.log("Webhook response:", data);

      // Start polling regardless of webhook response
      setIsPolling(true);
      toast({
        title: "PDF Generation Started",
        description: "We're generating your business plan. This may take 2-5 minutes.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      setErrors({
        submit: "Something went wrong while generating your PDF. Please try again.",
      });
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    navigate("/login");
  };

  const handleBack = () => {
    setShowPreview(false);
    setPdfUrl("");
    setIsPolling(false);
    if (fallbackPollingRef.current) clearInterval(fallbackPollingRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }
  };

  const handleDownload = async () => {
    // Check user role from profiles
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const userRole = profile?.role || "user";

    if (userRole === "user" && userPlan === "free") {
      toast({
        title: "Upgrade Required",
        description: "Download the full PDF by upgrading to Pro",
        variant: "destructive",
      });
      setTimeout(() => navigate("/pricing"), 1500);
    } else {
      // Auto-download for subscribed_user and admin
      window.open(pdfUrl, "_blank");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (showPreview && pdfUrl) {
    // Show 2 pages for free users, full PDF for subscribed/admin
    const pagesToShow = userPlan === "free" ? 2 : numPages;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Your Business Plan {userPlan === "free" && "(Preview)"}
                </h2>
                {userPlan === "free" && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing first 2 pages. Upgrade to Pro to view and download the full PDF.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline">
                  Back to Form
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6">
            <div className="flex flex-col items-center">
              <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} className="max-w-full">
                {Array.from(new Array(pagesToShow), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    className="mb-4 shadow-lg"
                    width={Math.min(window.innerWidth - 100, 800)}
                  />
                ))}
              </Document>

              {userPlan === "free" && numPages > 2 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-sm text-gray-700 mb-2">{numPages - 2} more pages available in the full PDF</p>
                </div>
              )}

              {userPlan === "free" ? (
                <Button
                  onClick={() => navigate("/pricing")}
                  className="mt-6 w-full max-w-md h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Upgrade to Pro - Download Full PDF
                </Button>
              ) : (
                <Button
                  onClick={handleDownload}
                  className="mt-6 w-full max-w-md h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download Full PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="space-y-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 text-center space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Basic Business Information
              </h2>
              <p className="text-gray-600 text-sm">Tell us about your business fundamentals</p>
            </div>
            <Button
              onClick={() => navigate('/business-plan')}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Market Research Agent
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Business Name *</Label>
              <Input
                value={formData.businessName}
                onChange={(e) => updateData({ businessName: e.target.value })}
                placeholder="Enter your business name"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.businessName && <p className="text-red-500 text-xs">{errors.businessName}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Business Description *</Label>
              <Textarea
                value={formData.businessDescription}
                onChange={(e) => updateData({ businessDescription: e.target.value })}
                placeholder="Describe what your business does..."
                className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.businessDescription && <p className="text-red-500 text-xs">{errors.businessDescription}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Number of Employees *</Label>
              <Input
                type="number"
                min="0"
                value={formData.numberOfEmployees}
                onChange={(e) => updateData({ numberOfEmployees: e.target.value })}
                placeholder="0"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.numberOfEmployees && <p className="text-red-500 text-xs">{errors.numberOfEmployees}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Where do you serve customers? *</Label>
              <Input
                value={formData.customerLocation}
                onChange={(e) => updateData({ customerLocation: e.target.value })}
                placeholder="e.g., Local, Regional, National, Global"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.customerLocation && <p className="text-red-500 text-xs">{errors.customerLocation}</p>}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Do you offer products or services? *</Label>
              <RadioGroup
                value={formData.offeringType}
                onValueChange={(value) => updateData({ offeringType: value })}
                className="grid grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <RadioGroupItem value="products" id="products" />
                  <Label htmlFor="products" className="cursor-pointer font-medium">
                    Products
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <RadioGroupItem value="services" id="services" />
                  <Label htmlFor="services" className="cursor-pointer font-medium">
                    Services
                  </Label>
                </div>
              </RadioGroup>
              {errors.offeringType && <p className="text-red-500 text-xs">{errors.offeringType}</p>}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                How do customers get your {formData.offeringType || "products/services"}? *
              </Label>
              <RadioGroup
                value={formData.deliveryMethod}
                onValueChange={(value) => updateData({ deliveryMethod: value })}
                className="grid grid-cols-1 gap-3"
              >
                {[
                  { value: "physical-store", label: "Physical Store/Location" },
                  { value: "online", label: "Online/Digital Delivery" },
                  { value: "hybrid", label: "Both Physical and Online" },
                  { value: "direct-sales", label: "Direct Sales/Field Service" },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.deliveryMethod && <p className="text-red-500 text-xs">{errors.deliveryMethod}</p>}
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p className="text-sm mt-1">{errors.submit}</p>
            </div>
          )}

          {isPolling && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </p>
              <p className="text-sm mt-1">Processing with AI agents. Please wait (usually 2-5 minutes).</p>
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
                "Generate Business Plan"
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

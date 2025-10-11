import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Step2BasicInfo } from "./steps/Step2BasicInfo";
import { Loader2 } from "lucide-react";

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
  businessType: "",
  planPurpose: "",
  planLanguage: "English",
  businessName: "",
  businessDescription: "",
  numberOfEmployees: "",
  customerLocation: "",
  offeringType: "",
  deliveryMethod: "",
  customerGroups: [{ description: "", incomeLevel: "" }],
  productsServices: [{ name: "", description: "" }],
  successDrivers: ["", "", ""],
  weaknesses: ["", "", ""],
  planCurrency: "USD",
  investments: [{ item: "", amount: 0 }],
  firstYearRevenue: "",
  yearlyGrowth: "",
  operationsCosts: [],
};

export const MultiStepBusinessPlanForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
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
      navigate("/");
    } else {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (stepData: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  };

  /**
   * Helper: try to parse JSON safely; if it fails, return null
   */
  const tryParseJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  /**
   * Submit: robust handling for JSON (expected) and a fallback for blobs.
   * Shows helpful error messages when the server doesn't return JSON.
   */
  const submitForm = async () => {
    setIsGenerating(true);
    setError(false);
    setPdfUrl(null);

    try {
      const n8nUrl = "https://hashirceo.app.n8n.cloud/webhook/2fcbe92b-1cd7-4ac9-987f-34dbaa1dc93f";

      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-" + Date.now(),
          reportId: "report-" + Date.now(),
          formData,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      // Non-2xx → grab a short body preview to help debug
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${errText.slice(0, 200)}`);
      }

      // Expected: JSON with { pdfUrl }
      if (contentType.includes("application/json")) {
        const data = await tryParseJson(response);
        const url = data?.pdfUrl;

        if (typeof url === "string" && url.length > 0) {
          setPdfUrl(url);
          setError(false);
          toast({
            title: "PDF Generated!",
            description: "Your business plan is ready to view.",
          });
          return;
        }

        // JSON arrived but no pdfUrl
        throw new Error("No pdfUrl in JSON response");
      }

      // Fallback: if server returns a PDF blob directly (unlikely for your n8n flow)
      if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
        const blob = await response.blob();
        if (!blob || blob.size === 0) throw new Error("Empty PDF response");
        const objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setError(false);
        toast({
          title: "PDF Generated!",
          description: "Your business plan is ready to view.",
        });
        return;
      }

      // Unexpected content type
      const preview = await response.text().catch(() => "");
      throw new Error(`Expected JSON but got "${contentType || "unknown"}". Body: ${preview.slice(0, 200)}`);
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      setError(true);
      toast({
        title: "Error",
        description: err?.message || "Failed to generate preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Optional: when a new pdfUrl is set, open it in a new tab automatically.
  useEffect(() => {
    if (pdfUrl) {
      try {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      } catch {
        // Ignore if popup blocked; user still sees the inline preview below
      }
    }
  }, [pdfUrl]);

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
        <div
          className="bg-card rounded-2xl p-6 sm:p-8 lg:p-10 border border-border"
          style={{ boxShadow: "var(--shadow-large)" }}
        >
          {renderStep()}
        </div>

        {/* Loading State */}
        {isGenerating && !pdfUrl && !error && (
          <div
            className="bg-card rounded-2xl p-8 border border-border flex flex-col items-center justify-center space-y-4"
            style={{ boxShadow: "var(--shadow-large)" }}
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-foreground font-medium">Generating preview…</p>
            <p className="text-muted-foreground text-sm">This may take a moment</p>
          </div>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <div
            className="bg-card rounded-2xl p-8 border border-border flex flex-col items-center justify-center space-y-4"
            style={{ boxShadow: "var(--shadow-large)" }}
          >
            <p className="text-destructive font-medium">Failed to generate preview</p>
            <p className="text-muted-foreground text-sm">
              Please try again. If it keeps failing, check the server response type.
            </p>
          </div>
        )}

        {/* PDF Preview */}
        {pdfUrl && !error && (
          <div
            className="bg-card rounded-2xl p-4 border border-border space-y-3"
            style={{ boxShadow: "var(--shadow-large)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground break-all">{pdfUrl}</p>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                Open in new tab
              </a>
            </div>
            <iframe
              src={pdfUrl}
              className="w-full"
              style={{
                height: "700px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              title="Business Plan PDF Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};

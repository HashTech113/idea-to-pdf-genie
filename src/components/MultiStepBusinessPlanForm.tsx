import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Step1Objective } from "./steps/Step1Objective";
import { Step2BasicInfo } from "./steps/Step2BasicInfo";
import { Step3CustomerGroups } from "./steps/Step3CustomerGroups";
import { Step4ProductsServices } from "./steps/Step4ProductsServices";
import { Step5SuccessDrivers } from "./steps/Step5SuccessDrivers";
import { Step6Investment } from "./steps/Step6Investment";
import { Step7Financial } from "./steps/Step7Financial";
import { ProgressIndicator } from "./ProgressIndicator";

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
  planCurrency: "",
  investments: [],
  firstYearRevenue: "",
  yearlyGrowth: "",
  operationsCosts: [],
};

export const MultiStepBusinessPlanForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const updateData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Generate unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save form data to sessionStorage
    sessionStorage.setItem(`businessPlan_${reportId}`, JSON.stringify(formData));
    
    // Navigate to generating page
    navigate(`/generating/${reportId}`);
  };

  const steps = [
    "Objective",
    "Basic Info",
    "Customers",
    "Products",
    "Success",
    "Investment",
    "Financial",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card rounded-2xl shadow-xl p-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={7} />

        <div className="mt-8">
          {currentStep === 1 && (
            <Step1Objective data={formData} updateData={updateData} onNext={handleNext} />
          )}
          {currentStep === 2 && (
            <Step2BasicInfo
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
              onLogout={handleLogout}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && (
            <Step3CustomerGroups
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          {currentStep === 4 && (
            <Step4ProductsServices
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          {currentStep === 5 && (
            <Step5SuccessDrivers
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          {currentStep === 6 && (
            <Step6Investment
              data={formData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          {currentStep === 7 && (
            <Step7Financial
              data={formData}
              updateData={updateData}
              onSubmit={handleSubmit}
              onPrev={handlePrev}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiStepBusinessPlanForm;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormData } from '../MultiStepBusinessPlanForm';

interface Step1Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
}

export const Step1Objective = ({ data, updateData, onNext }: Step1Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.privacyAccepted) {
      newErrors.privacy = 'You must accept the privacy notice';
    }
    if (!data.businessType) {
      newErrors.businessType = 'Please select your business type';
    }
    if (!data.planPurpose) {
      newErrors.planPurpose = 'Please select what you will use this plan for';
    }
    if (!data.planLanguage) {
      newErrors.planLanguage = 'Please select a language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full border border-primary/30 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg"></div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Business Plan Objective
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          Let's start by understanding your business plan objectives and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Privacy Notice */}
        <div className="bg-secondary/50 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy"
              checked={data.privacyAccepted}
              onCheckedChange={(checked) => 
                updateData({ privacyAccepted: checked as boolean })
              }
              className="mt-1"
            />
            <div className="space-y-2">
              <Label htmlFor="privacy" className="text-sm font-medium">
                Privacy Notice Agreement
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I understand that my business information will be processed to generate a comprehensive business plan. 
                All data is handled securely and used solely for plan generation purposes.
              </p>
            </div>
          </div>
          {errors.privacy && (
            <p className="text-destructive text-xs mt-2">{errors.privacy}</p>
          )}
        </div>

        {/* Business Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">
            Is this for an existing or upcoming business?
          </Label>
          <RadioGroup
            value={data.businessType}
            onValueChange={(value) => updateData({ businessType: value })}
            className="grid grid-cols-1 gap-3"
          >
            <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="flex-1 cursor-pointer">
                Existing Business
              </Label>
            </div>
            <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
              <RadioGroupItem value="upcoming" id="upcoming" />
              <Label htmlFor="upcoming" className="flex-1 cursor-pointer">
                Upcoming Business
              </Label>
            </div>
          </RadioGroup>
          {errors.businessType && (
            <p className="text-destructive text-xs">{errors.businessType}</p>
          )}
        </div>

        {/* Plan Purpose */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">
            What will you use this business plan for?
          </Label>
          <RadioGroup
            value={data.planPurpose}
            onValueChange={(value) => updateData({ planPurpose: value })}
            className="grid grid-cols-1 gap-3"
          >
            {[
              { value: 'funding', label: 'Seeking Investment/Funding' },
              { value: 'loan', label: 'Bank Loan Application' },
              { value: 'strategy', label: 'Strategic Planning' },
              { value: 'presentation', label: 'Investor Presentation' },
              { value: 'other', label: 'Other Purpose' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.planPurpose && (
            <p className="text-destructive text-xs">{errors.planPurpose}</p>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">
            Plan Language
          </Label>
          <Select
            value={data.planLanguage}
            onValueChange={(value) => updateData({ planLanguage: value })}
          >
            <SelectTrigger className="bg-input border-primary/20 hover:border-primary/30">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Portuguese">Portuguese</SelectItem>
            </SelectContent>
          </Select>
          {errors.planLanguage && (
            <p className="text-destructive text-xs">{errors.planLanguage}</p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button
          onClick={handleNext}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};
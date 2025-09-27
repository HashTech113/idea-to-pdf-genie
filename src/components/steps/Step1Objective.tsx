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
  onSubmit: () => void;
  isLoading: boolean;
}

export const Step1Objective = ({ data, updateData, onSubmit, isLoading }: Step1Props) => {
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

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-6 mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Business Plan Objective
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
          Let's start by understanding your business plan objectives and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Privacy Notice */}
        <div className="bg-muted/30 border border-border rounded-xl p-6" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <div className="flex items-start space-x-4">
            <Checkbox
              id="privacy"
              checked={data.privacyAccepted}
              onCheckedChange={(checked) => 
                updateData({ privacyAccepted: checked as boolean })
              }
              className="mt-1"
            />
            <div className="space-y-3">
              <Label htmlFor="privacy" className="text-base font-semibold text-foreground">
                Privacy Notice Agreement
              </Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I understand that my business information will be processed to generate a comprehensive business plan. 
                All data is handled securely and used solely for plan generation purposes.
              </p>
            </div>
          </div>
          {errors.privacy && (
            <p className="text-destructive text-sm mt-3">{errors.privacy}</p>
          )}
        </div>

        {/* Business Type */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-foreground">
            Is this for an existing or upcoming business?
          </Label>
          <RadioGroup
            value={data.businessType}
            onValueChange={(value) => updateData({ businessType: value })}
            className="grid grid-cols-1 gap-4"
          >
            <div className="flex items-center space-x-4 bg-background p-5 rounded-xl border-2 border-border hover:border-primary/50 transition-all duration-200" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="flex-1 cursor-pointer text-base font-medium">
                Existing Business
              </Label>
            </div>
            <div className="flex items-center space-x-4 bg-background p-5 rounded-xl border-2 border-border hover:border-primary/50 transition-all duration-200" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <RadioGroupItem value="upcoming" id="upcoming" />
              <Label htmlFor="upcoming" className="flex-1 cursor-pointer text-base font-medium">
                Upcoming Business
              </Label>
            </div>
          </RadioGroup>
          {errors.businessType && (
            <p className="text-destructive text-sm mt-2">{errors.businessType}</p>
          )}
        </div>

        {/* Plan Purpose */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-foreground">
            What will you use this business plan for?
          </Label>
          <RadioGroup
            value={data.planPurpose}
            onValueChange={(value) => updateData({ planPurpose: value })}
            className="grid grid-cols-1 gap-4"
          >
            {[
              { value: 'funding', label: 'Seeking Investment/Funding' },
              { value: 'loan', label: 'Bank Loan Application' },
              { value: 'strategy', label: 'Strategic Planning' },
              { value: 'presentation', label: 'Investor Presentation' },
              { value: 'other', label: 'Other Purpose' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-4 bg-background p-5 rounded-xl border-2 border-border hover:border-primary/50 transition-all duration-200" style={{ boxShadow: 'var(--shadow-soft)' }}>
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base font-medium">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.planPurpose && (
            <p className="text-destructive text-sm mt-2">{errors.planPurpose}</p>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-foreground">
            Plan Language
          </Label>
          <Select
            value={data.planLanguage}
            onValueChange={(value) => updateData({ planLanguage: value })}
          >
            <SelectTrigger className="h-14 bg-input border-2 border-border hover:border-primary/50 rounded-xl text-base" style={{ boxShadow: 'var(--shadow-soft)' }}>
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
            <p className="text-destructive text-sm mt-2">{errors.planLanguage}</p>
          )}
        </div>
      </div>

      <div className="pt-8">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-16 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200"
          style={{ boxShadow: 'var(--shadow-medium)' }}
        >
          {isLoading ? 'Generating Business Plan...' : 'Generate Business Plan PDF'}
        </Button>
      </div>
    </div>
  );
};
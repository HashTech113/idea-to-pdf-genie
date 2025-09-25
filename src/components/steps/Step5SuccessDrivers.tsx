import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormData } from '../MultiStepBusinessPlanForm';

interface Step5Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step5SuccessDrivers = ({ data, updateData, onNext, onPrev }: Step5Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.successDrivers[0]?.trim()) {
      newErrors.firstDriver = 'At least one success driver is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const updateSuccessDriver = (index: number, value: string) => {
    const newDrivers = [...data.successDrivers];
    newDrivers[index] = value;
    updateData({ successDrivers: newDrivers });
  };

  const updateWeakness = (index: number, value: string) => {
    const newWeaknesses = [...data.weaknesses];
    newWeaknesses[index] = value;
    updateData({ weaknesses: newWeaknesses });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Success Drivers & Weaknesses
        </h2>
        <p className="text-muted-foreground text-sm">
          Identify key factors for success and potential challenges
        </p>
      </div>

      <div className="space-y-8">
        {/* Success Drivers */}
        <div className="bg-secondary/20 border border-primary/10 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Success Drivers
            </h3>
            <p className="text-muted-foreground text-sm">
              What factors will drive your business to success? (First one is required)
            </p>
          </div>

          <div className="space-y-4">
            {data.successDrivers.map((driver, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Success Driver {index + 1} {index === 0 && <span className="text-accent text-sm">(Required)</span>}
                </Label>
                <Input
                  value={driver}
                  onChange={(e) => updateSuccessDriver(index, e.target.value)}
                  placeholder={`e.g., ${index === 0 ? 'Strong customer relationships' : index === 1 ? 'Innovative technology' : 'Strategic partnerships'}`}
                  className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
                />
                {index === 0 && errors.firstDriver && (
                  <p className="text-destructive text-xs">{errors.firstDriver}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-secondary/20 border border-primary/10 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Potential Weaknesses
            </h3>
            <p className="text-muted-foreground text-sm">
              What challenges or weaknesses might your business face? (All optional)
            </p>
          </div>

          <div className="space-y-4">
            {data.weaknesses.map((weakness, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Weakness {index + 1} <span className="text-muted-foreground text-sm">(Optional)</span>
                </Label>
                <Input
                  value={weakness}
                  onChange={(e) => updateWeakness(index, e.target.value)}
                  placeholder={`e.g., ${index === 0 ? 'Limited initial capital' : index === 1 ? 'New market competition' : 'Regulatory compliance'}`}
                  className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex-1 h-12 border-primary/20 hover:border-primary/30"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};
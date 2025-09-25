import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { FormData } from '../MultiStepBusinessPlanForm';

interface Step3Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3CustomerGroups = ({ data, updateData, onNext, onPrev }: Step3Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.customerGroups[0]?.description.trim()) {
      newErrors.firstGroup = 'At least one customer group description is required';
    }
    if (!data.customerGroups[0]?.incomeLevel) {
      newErrors.firstIncome = 'Income level for first customer group is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const addCustomerGroup = () => {
    if (data.customerGroups.length < 3) {
      updateData({
        customerGroups: [...data.customerGroups, { description: '', incomeLevel: '' }]
      });
    }
  };

  const removeCustomerGroup = (index: number) => {
    if (index > 0) { // Don't allow removing the first group
      const newGroups = data.customerGroups.filter((_, i) => i !== index);
      updateData({ customerGroups: newGroups });
    }
  };

  const updateCustomerGroup = (index: number, field: 'description' | 'incomeLevel', value: string) => {
    const newGroups = [...data.customerGroups];
    newGroups[index] = { ...newGroups[index], [field]: value };
    updateData({ customerGroups: newGroups });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Customer Groups
        </h2>
        <p className="text-muted-foreground text-sm">
          Define up to 3 customer segments (first one is required)
        </p>
      </div>

      <div className="space-y-6">
        {data.customerGroups.map((group, index) => (
          <div key={index} className="bg-secondary/20 border border-primary/10 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Customer Group {index + 1} {index === 0 && <span className="text-accent text-sm">(Required)</span>}
              </h3>
              {index > 0 && (
                <Button
                  onClick={() => removeCustomerGroup(index)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Customer Group Description */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Customer Group Description
              </Label>
              <Textarea
                value={group.description}
                onChange={(e) => updateCustomerGroup(index, 'description', e.target.value)}
                placeholder="Describe this customer segment (demographics, needs, characteristics)..."
                className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 min-h-[80px]"
              />
              {index === 0 && errors.firstGroup && (
                <p className="text-destructive text-xs">{errors.firstGroup}</p>
              )}
            </div>

            {/* Income Level */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                Income Level
              </Label>
              <RadioGroup
                value={group.incomeLevel}
                onValueChange={(value) => updateCustomerGroup(index, 'incomeLevel', value)}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { value: 'low', label: 'Low Income' },
                  { value: 'middle', label: 'Middle Income' },
                  { value: 'high', label: 'High Income' },
                  { value: 'mixed', label: 'Mixed Income' }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                    <RadioGroupItem value={option.value} id={`${index}-${option.value}`} />
                    <Label htmlFor={`${index}-${option.value}`} className="cursor-pointer text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {index === 0 && errors.firstIncome && (
                <p className="text-destructive text-xs">{errors.firstIncome}</p>
              )}
            </div>
          </div>
        ))}

        {data.customerGroups.length < 3 && (
          <Button
            onClick={addCustomerGroup}
            variant="outline"
            className="w-full h-12 border-primary/20 hover:border-primary/30 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer Group (Optional)
          </Button>
        )}
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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { FormData } from '../MultiStepBusinessPlanForm';

interface Step6Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step6Investment = ({ data, updateData, onNext, onPrev }: Step6Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.planCurrency) {
      newErrors.currency = 'Please select a currency';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const addInvestmentItem = () => {
    updateData({
      investments: [...data.investments, { item: '', amount: 0 }]
    });
  };

  const removeInvestmentItem = (index: number) => {
    if (data.investments.length > 1) {
      const newInvestments = data.investments.filter((_, i) => i !== index);
      updateData({ investments: newInvestments });
    }
  };

  const updateInvestmentItem = (index: number, field: 'item' | 'amount', value: string | number) => {
    const newInvestments = [...data.investments];
    newInvestments[index] = { ...newInvestments[index], [field]: value };
    updateData({ investments: newInvestments });
  };

  const totalInvestment = data.investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Currency & Investment Details
        </h2>
        <p className="text-muted-foreground text-sm">
          Set your plan currency and define initial investment requirements
        </p>
      </div>

      <div className="space-y-6">
        {/* Currency Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">
            Plan Currency
          </Label>
          <Select
            value={data.planCurrency}
            onValueChange={(value) => updateData({ planCurrency: value })}
          >
            <SelectTrigger className="bg-input border-primary/20 hover:border-primary/30 h-12">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && (
            <p className="text-destructive text-xs">{errors.currency}</p>
          )}
        </div>

        {/* Investment Items */}
        <div className="bg-secondary/20 border border-primary/10 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Initial Investment Items
              </h3>
              <p className="text-muted-foreground text-sm">
                Break down your initial investment needs
              </p>
            </div>
            <Button
              onClick={addInvestmentItem}
              variant="outline"
              size="sm"
              className="border-primary/20 hover:border-primary/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground pb-2 border-b border-primary/10">
              <div className="col-span-6">Investment Item</div>
              <div className="col-span-4">Amount ({data.planCurrency})</div>
              <div className="col-span-2">Action</div>
            </div>

            {/* Investment Items */}
            {data.investments.map((investment, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6">
                  <Input
                    value={investment.item}
                    onChange={(e) => updateInvestmentItem(index, 'item', e.target.value)}
                    placeholder="e.g., Equipment, Software, Marketing"
                    className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={investment.amount || ''}
                    onChange={(e) => updateInvestmentItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50"
                  />
                </div>
                <div className="col-span-2">
                  {data.investments.length > 1 && (
                    <Button
                      onClick={() => removeInvestmentItem(index)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="border-t border-primary/10 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">
                  Total Investment Amount:
                </span>
                <span className="text-xl font-bold text-primary">
                  {data.planCurrency} {totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
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
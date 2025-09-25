import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { FormData } from '../MultiStepBusinessPlanForm';

interface Step7Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

export const Step7Financial = ({ data, updateData, onSubmit, onPrev, isLoading }: Step7Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.firstYearRevenue.trim()) {
      newErrors.revenue = 'First year revenue is required';
    }
    if (!data.yearlyGrowth.trim()) {
      newErrors.growth = 'Yearly revenue growth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    }
  };

  const addOperationsCost = () => {
    updateData({
      operationsCosts: [...data.operationsCosts, { category: '', percentage: 0, amount: 0 }]
    });
  };

  const removeOperationsCost = (index: number) => {
    const newCosts = data.operationsCosts.filter((_, i) => i !== index);
    updateData({ operationsCosts: newCosts });
  };

  const updateOperationsCost = (index: number, field: 'category' | 'percentage' | 'amount', value: string | number) => {
    const newCosts = [...data.operationsCosts];
    newCosts[index] = { ...newCosts[index], [field]: value };
    updateData({ operationsCosts: newCosts });
  };

  // Auto-calculate amounts based on revenue and percentage
  useEffect(() => {
    const revenue = parseFloat(data.firstYearRevenue) || 0;
    const updatedCosts = data.operationsCosts.map(cost => ({
      ...cost,
      amount: revenue * (cost.percentage / 100)
    }));
    if (JSON.stringify(updatedCosts) !== JSON.stringify(data.operationsCosts)) {
      updateData({ operationsCosts: updatedCosts });
    }
  }, [data.firstYearRevenue, data.operationsCosts]);

  const totalCosts = data.operationsCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
  const revenue = parseFloat(data.firstYearRevenue) || 0;
  const netProfit = revenue - totalCosts;
  const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Financial Projections
        </h2>
        <p className="text-muted-foreground text-sm">
          Define your revenue projections and operational costs
        </p>
      </div>

      <div className="space-y-6">
        {/* Revenue Projections */}
        <div className="bg-secondary/20 border border-primary/10 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            Revenue Projections
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                First Year Revenue ({data.planCurrency})
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={data.firstYearRevenue}
                onChange={(e) => updateData({ firstYearRevenue: e.target.value })}
                placeholder="0.00"
                className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
              />
              {errors.revenue && (
                <p className="text-destructive text-xs">{errors.revenue}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Yearly Revenue Growth (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="1000"
                step="0.1"
                value={data.yearlyGrowth}
                onChange={(e) => updateData({ yearlyGrowth: e.target.value })}
                placeholder="15"
                className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
              />
              {errors.growth && (
                <p className="text-destructive text-xs">{errors.growth}</p>
              )}
            </div>
          </div>
        </div>

        {/* Operations Costs */}
        <div className="bg-secondary/20 border border-primary/10 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Business Operations Costs
              </h3>
              <p className="text-muted-foreground text-sm">
                Define your yearly operational expenses as percentages of revenue
              </p>
            </div>
            <Button
              onClick={addOperationsCost}
              variant="outline"
              size="sm"
              className="border-primary/20 hover:border-primary/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Cost
            </Button>
          </div>

          {data.operationsCosts.length > 0 && (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground pb-2 border-b border-primary/10">
                <div className="col-span-4">Cost Category</div>
                <div className="col-span-3">Percentage (%)</div>
                <div className="col-span-3">Amount ({data.planCurrency})</div>
                <div className="col-span-2">Action</div>
              </div>

              {/* Cost Items */}
              {data.operationsCosts.map((cost, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <Input
                      value={cost.category}
                      onChange={(e) => updateOperationsCost(index, 'category', e.target.value)}
                      placeholder="e.g., Marketing, Rent, Salaries"
                      className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={cost.percentage || ''}
                      onChange={(e) => updateOperationsCost(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50"
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="bg-muted/50 border border-primary/10 rounded-md px-3 py-2 text-sm">
                      {cost.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Button
                      onClick={() => removeOperationsCost(index)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Financial Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Costs</div>
              <div className="text-lg font-bold text-foreground">
                {data.planCurrency} {totalCosts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="text-center p-4 bg-secondary/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Net Profit</div>
              <div className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.planCurrency} {netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="text-center p-4 bg-secondary/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Net Profit Margin</div>
              <div className={`text-lg font-bold ${netProfitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netProfitMargin.toFixed(1)}%
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
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Generating Business Plan...
            </>
          ) : (
            <>
              Generate Business Plan PDF
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
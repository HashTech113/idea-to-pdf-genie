import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LogOut } from 'lucide-react';
import { FormData } from '../MultiStepBusinessPlanForm';

interface Step2Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  onLogout: () => void;
  isLoading?: boolean;
}

export const Step2BasicInfo = ({ data, updateData, onNext, onPrev, onLogout, isLoading }: Step2Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!data.businessDescription.trim()) {
      newErrors.businessDescription = 'Business description is required';
    }
    if (!data.numberOfEmployees) {
      newErrors.numberOfEmployees = 'Number of employees is required';
    }
    if (!data.customerLocation.trim()) {
      newErrors.customerLocation = 'Customer location is required';
    }
    if (!data.offeringType) {
      newErrors.offeringType = 'Please select offering type';
    }
    if (!data.deliveryMethod) {
      newErrors.deliveryMethod = 'Please select delivery method';
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
        <h2 className="text-2xl font-bold text-foreground">
          Basic Business Information
        </h2>
        <p className="text-muted-foreground text-sm">
          Tell us about your business fundamentals
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            Business Name
          </Label>
          <Input
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            placeholder="Enter your business name"
            className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
          />
          {errors.businessName && (
            <p className="text-destructive text-xs">{errors.businessName}</p>
          )}
        </div>

        {/* Business Description */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            Business Description
          </Label>
          <Textarea
            value={data.businessDescription}
            onChange={(e) => updateData({ businessDescription: e.target.value })}
            placeholder="Describe what your business does..."
            className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 min-h-[100px]"
          />
          {errors.businessDescription && (
            <p className="text-destructive text-xs">{errors.businessDescription}</p>
          )}
        </div>

        {/* Number of Employees */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            Number of Employees
          </Label>
          <Input
            type="number"
            min="0"
            value={data.numberOfEmployees}
            onChange={(e) => updateData({ numberOfEmployees: e.target.value })}
            placeholder="0"
            className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
          />
          {errors.numberOfEmployees && (
            <p className="text-destructive text-xs">{errors.numberOfEmployees}</p>
          )}
        </div>

        {/* Customer Location */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            Where do you serve customers?
          </Label>
          <Input
            value={data.customerLocation}
            onChange={(e) => updateData({ customerLocation: e.target.value })}
            placeholder="e.g., Local, Regional, National, Global"
            className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
          />
          {errors.customerLocation && (
            <p className="text-destructive text-xs">{errors.customerLocation}</p>
          )}
        </div>

        {/* Product or Service */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">
            Do you offer products or services?
          </Label>
          <RadioGroup
            value={data.offeringType}
            onValueChange={(value) => updateData({ offeringType: value })}
            className="grid grid-cols-2 gap-3"
          >
            <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
              <RadioGroupItem value="products" id="products" />
              <Label htmlFor="products" className="cursor-pointer">Products</Label>
            </div>
            <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
              <RadioGroupItem value="services" id="services" />
              <Label htmlFor="services" className="cursor-pointer">Services</Label>
            </div>
          </RadioGroup>
          {errors.offeringType && (
            <p className="text-destructive text-xs">{errors.offeringType}</p>
          )}
        </div>

        {/* Delivery Method */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">
            How do customers get your {data.offeringType || 'products/services'}?
          </Label>
          <RadioGroup
            value={data.deliveryMethod}
            onValueChange={(value) => updateData({ deliveryMethod: value })}
            className="grid grid-cols-1 gap-3"
          >
            {[
              { value: 'physical-store', label: 'Physical Store/Location' },
              { value: 'online', label: 'Online/Digital Delivery' },
              { value: 'hybrid', label: 'Both Physical and Online' },
              { value: 'direct-sales', label: 'Direct Sales/Field Service' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.deliveryMethod && (
            <p className="text-destructive text-xs">{errors.deliveryMethod}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? 'Generating Preview...' : 'View Preview'}
        </Button>
        
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full h-12 gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { FormData } from '../MultiStepBusinessPlanForm';

interface Step4Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step4ProductsServices = ({ data, updateData, onNext, onPrev }: Step4Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.productsServices[0]?.name.trim()) {
      newErrors.firstName = 'At least one product/service name is required';
    }
    if (!data.productsServices[0]?.description.trim()) {
      newErrors.firstDescription = 'Description for first product/service is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const addProductService = () => {
    if (data.productsServices.length < 5) {
      updateData({
        productsServices: [...data.productsServices, { name: '', description: '' }]
      });
    }
  };

  const removeProductService = (index: number) => {
    if (index > 0) { // Don't allow removing the first item
      const newItems = data.productsServices.filter((_, i) => i !== index);
      updateData({ productsServices: newItems });
    }
  };

  const updateProductService = (index: number, field: 'name' | 'description', value: string) => {
    const newItems = [...data.productsServices];
    newItems[index] = { ...newItems[index], [field]: value };
    updateData({ productsServices: newItems });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Products & Services
        </h2>
        <p className="text-muted-foreground text-sm">
          Define up to 5 products or services (first one is required)
        </p>
      </div>

      <div className="space-y-6">
        {data.productsServices.map((item, index) => (
          <div key={index} className="bg-secondary/20 border border-primary/10 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Product/Service {index + 1} {index === 0 && <span className="text-accent text-sm">(Required)</span>}
              </h3>
              {index > 0 && (
                <Button
                  onClick={() => removeProductService(index)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Name
              </Label>
              <Input
                value={item.name}
                onChange={(e) => updateProductService(index, 'name', e.target.value)}
                placeholder="Enter product or service name"
                className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 h-12"
              />
              {index === 0 && errors.firstName && (
                <p className="text-destructive text-xs">{errors.firstName}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Description
              </Label>
              <Textarea
                value={item.description}
                onChange={(e) => updateProductService(index, 'description', e.target.value)}
                placeholder="Describe the features, benefits, and value proposition..."
                className="bg-input border-primary/20 hover:border-primary/30 focus:border-primary/50 min-h-[80px]"
              />
              {index === 0 && errors.firstDescription && (
                <p className="text-destructive text-xs">{errors.firstDescription}</p>
              )}
            </div>
          </div>
        ))}

        {data.productsServices.length < 5 && (
          <Button
            onClick={addProductService}
            variant="outline"
            className="w-full h-12 border-primary/20 hover:border-primary/30 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product/Service (Optional)
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
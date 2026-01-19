'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Sparkles,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { BusinessBasicsStep } from './BusinessBasicsStep';
import { AddOnsStep } from './AddOnsStep';
import { PaymentStep } from './PaymentStep';
import { SuccessStep } from './SuccessStep';

type OnboardingStep = 'business' | 'addons' | 'payment' | 'success';

const steps: { id: OnboardingStep; title: string; icon: typeof Building2 }[] = [
  { id: 'business', title: 'Business Basics', icon: Building2 },
  { id: 'addons', title: 'Choose Add-ons', icon: Sparkles },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'success', title: 'Success', icon: CheckCircle2 },
];

export interface BusinessInfo {
  name: string;
  type: string;
  timezone: string;
  email: string;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('business');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    type: '',
    timezone: 'America/Chicago',
    email: '',
  });

  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Submit to API
      setCurrentStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Progress bar */}
      <div className="bg-white border-b border-charcoal/10 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? 'bg-sage text-white'
                      : 'bg-charcoal/10 text-charcoal/40'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStepIndex ? 'bg-sage' : 'bg-charcoal/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-charcoal/60">
            Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].title}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {currentStep === 'business' && (
          <BusinessBasicsStep
            data={businessInfo}
            onChange={setBusinessInfo}
            onNext={nextStep}
          />
        )}
        {currentStep === 'addons' && (
          <AddOnsStep
            selected={selectedAddOns}
            onChange={setSelectedAddOns}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 'payment' && (
          <PaymentStep
            businessInfo={businessInfo}
            selectedAddOns={selectedAddOns}
            onComplete={handleComplete}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        )}
        {currentStep === 'success' && <SuccessStep />}
      </div>
    </div>
  );
}

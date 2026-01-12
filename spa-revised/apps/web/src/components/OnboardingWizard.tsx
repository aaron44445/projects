'use client'

import { useState } from 'react'
import { OnboardingStep } from './OnboardingStep'
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

const steps = [
  {
    id: 'services',
    title: 'Add Your Services',
    description: 'Tell us what services your salon offers',
    icon: 'Scissors'
  },
  {
    id: 'staff',
    title: 'Add Your Staff',
    description: 'Add team members and their availability',
    icon: 'Users'
  },
  {
    id: 'addons',
    title: 'Choose Add-ons',
    description: 'Select features that fit your business',
    icon: 'Gift'
  },
  {
    id: 'payment',
    title: 'Set Up Payment',
    description: 'Configure payment processing',
    icon: 'CreditCard'
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'Your salon is all set up',
    icon: 'CheckCircle'
  }
]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const handleNext = () => {
    setCompleted({ ...completed, [steps[currentStep].id]: true })
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = steps[currentStep]

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => i < currentStep && setCurrentStep(i)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2"
                  style={{
                    backgroundColor: i < currentStep ? '#C7DCC8' : i === currentStep ? '#C7DCC8' : '#E8E6E4',
                    color: i <= currentStep ? '#fff' : '#999'
                  }}
                >
                  {i < currentStep ? <CheckCircle size={24} /> : i + 1}
                </div>
                <span className="text-xs text-center" style={{ color: '#666' }}>
                  {s.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                backgroundColor: '#C7DCC8'
              }}
            />
          </div>
        </div>

        {/* Current step */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
            {step.title}
          </h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {step.description}
          </p>

          <OnboardingStep stepId={step.id} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#E8E6E4', color: '#2C2C2C' }}
          >
            <ArrowLeft size={20} /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2"
            style={{ backgroundColor: '#C7DCC8' }}
          >
            {currentStep === steps.length - 1 ? 'Start Using Pecase' : 'Next'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

"use client";

import { motion } from "framer-motion";

interface StepProgressProps {
  steps: { number: number; label: string }[];
  currentStep: number;
}

export default function StepProgress({ steps, currentStep }: StepProgressProps) {
  const completedCount = steps.filter((s) => s.number < currentStep).length;
  const percent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="mb-8">
      {/* Percentage bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] text-white/40">
          Step {currentStep} of {steps.length}
        </span>
        <span className="text-[13px] font-medium text-[#20aab6]">{percent}% complete</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full bg-[#20aab6] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step labels */}
      <div className="flex gap-1">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  isCompleted
                    ? "bg-[#20aab6] text-white"
                    : isCurrent
                    ? "bg-[#20aab6]/15 text-[#20aab6] border border-[#20aab6]/40"
                    : "bg-white/[0.04] text-white/20 border border-white/[0.08]"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-[10px] text-center leading-tight ${
                  isCurrent ? "text-[#20aab6] font-medium" : isCompleted ? "text-white/50" : "text-white/20"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

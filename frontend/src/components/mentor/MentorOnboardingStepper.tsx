import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStepItem {
  id: string;
  label: string;
  shortLabel?: string;
}

interface MentorOnboardingStepperProps {
  steps: readonly OnboardingStepItem[];
  activeStepId: string;
  className?: string;
}

export function MentorOnboardingStepper({ steps, activeStepId, className }: MentorOnboardingStepperProps) {
  const activeIndex = steps.findIndex((s) => s.id === activeStepId);

  return (
    <nav aria-label="Mentor onboarding progress" className={cn("w-full py-2", className)}>
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const isDone = index < activeIndex;
          const isCurrent = step.id === activeStepId;
          const isUpcoming = index > activeIndex;

          return (
            <li
              key={step.id}
              className="flex-1 flex items-center min-w-0"
              aria-current={isCurrent ? "step" : undefined}
            >
              <div
                className={cn(
                  "group flex items-center gap-2 w-full p-1.5 sm:p-2 rounded-lg border transition-all duration-150",
                  isCurrent &&
                    "border-slate-900 bg-slate-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-950 font-semibold",
                  isDone &&
                    "border-slate-200 bg-slate-50/80 text-slate-800 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200",
                  isUpcoming &&
                    "border-slate-200/60 bg-transparent text-slate-600 dark:border-white/5 dark:text-slate-400 font-medium",
                )}
              >
                {/* Step Indicator Badge */}
                <div
                  className={cn(
                    "flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-mono font-bold transition-colors",
                    isCurrent && "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950",
                    isDone && "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950",
                    isUpcoming && "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400",
                  )}
                >
                  {isDone ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : <span>{index + 1}</span>}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "text-xs truncate font-medium",
                    isCurrent && "text-white dark:text-slate-950 font-semibold",
                    isDone && "text-slate-800 dark:text-slate-200",
                    isUpcoming && "text-slate-600 dark:text-slate-400",
                  )}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel ?? step.label}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

"use client";

import { useNumberInput } from "./use-number-input";

type Props = {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** Optional explicit step size; if omitted, defaults to (max-min)/20 rounded up */
  step?: number;
  increaseAria: string;
  decreaseAria: string;
  ariaDescribedBy?: string;
  /** Optional container class; when provided, external CSS can control layout */
  className?: string | undefined;
};

export function NumberInputWithSteppers({
  id,
  value,
  min,
  max,
  onChange,
  step,
  increaseAria,
  decreaseAria,
  ariaDescribedBy,
  className
}: Props) {
  // Centralized step/clamp logic
  const { inc: onInc, dec: onDec, canInc, canDec } = useNumberInput({
    value,
    min,
    max,
    onChange,
    ...(step !== undefined ? { step } : undefined)
  });
  const usesCustomLayout = Boolean(className);
  return (
    <div className={`${className ? className + ' ' : ''}relative`} suppressHydrationWarning>
      <input
        type="number"
        inputMode="numeric"
        autoComplete="off"
        id={id}
        className={
          usesCustomLayout
            ? undefined
            : "w-full px-3 py-3 text-base font-bold rounded-lg border border-input bg-background text-foreground outline-none appearance-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        }
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        {...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {})}
        suppressHydrationWarning
        data-dashlane-ignore="true"
        data-1p-ignore
        data-lpignore="true"
      />
      {usesCustomLayout ? (
        <div suppressHydrationWarning>
          <button
            aria-label={increaseAria}
            onClick={onInc}
            disabled={!canInc}
            data-dashlane-ignore="true"
            data-1p-ignore
            data-lpignore="true"
            suppressHydrationWarning
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            aria-label={decreaseAria}
            onClick={onDec}
            disabled={!canDec}
            data-dashlane-ignore="true"
            data-1p-ignore
            data-lpignore="true"
            suppressHydrationWarning
            type="button"
          >
            <span aria-hidden="true">–</span>
          </button>
        </div>
      ) : (
        <div className="absolute right-1 top-1 z-10 flex flex-col gap-1" suppressHydrationWarning>
          <button
            aria-label={increaseAria}
            onClick={onInc}
            className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs disabled:opacity-40"
            disabled={!canInc}
            data-dashlane-ignore="true"
            data-1p-ignore
            data-lpignore="true"
            suppressHydrationWarning
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            aria-label={decreaseAria}
            onClick={onDec}
            className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs disabled:opacity-40"
            disabled={!canDec}
            data-dashlane-ignore="true"
            data-1p-ignore
            data-lpignore="true"
            suppressHydrationWarning
            type="button"
          >
            <span aria-hidden="true">–</span>
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { useNumberInput } from "./use-number-input";

function formatWithGrouping(n: number): string {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0;
  try {
    return new Intl.NumberFormat("en-US").format(v);
  } catch {
    return String(v);
  }
}

function stripToDigits(input: string): string {
  // Supports paste like "10,000" or "$10 000" by stripping to digits.
  return input.replace(/[^\d]/g, "");
}

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
  /**
   * When true: renders a text input with numeric keyboard and formats with commas on blur.
   * Keeps a raw, unformatted value while focused to avoid cursor-jank.
   */
  formatWithCommas?: boolean;
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
  className,
  formatWithCommas = false,
}: Props) {
  const usesCustomLayout = Boolean(className);
  const { inc, dec, canInc, canDec } = useNumberInput({
    value,
    min,
    max,
    onChange,
    ...(step !== undefined ? { step } : undefined),
  });

  const [isFocused, setIsFocused] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState<string>(() =>
    formatWithCommas ? formatWithGrouping(value) : ""
  );
  const stepperCommitRef = React.useRef(false);

  // Keep display in sync when NOT actively editing, and also when steppers are used while focused.
  React.useEffect(() => {
    if (!formatWithCommas) return;

    // If the value changed due to stepper clicks, update even while focused.
    if (isFocused && stepperCommitRef.current) {
      setDisplayValue(String(value));
      stepperCommitRef.current = false;
      return;
    }

    if (!isFocused) {
      setDisplayValue(formatWithGrouping(value));
    }
  }, [value, formatWithCommas, isFocused]);

  const clampLocal = React.useCallback(
    (n: number) => Math.max(min, Math.min(max, n)),
    [min, max]
  );

  const handleFocus = React.useCallback(() => {
    if (!formatWithCommas) return;
    setIsFocused(true);
    setDisplayValue(String(value));
  }, [formatWithCommas, value]);

  const handleBlur = React.useCallback(() => {
    if (!formatWithCommas) return;
    setIsFocused(false);

    const digits = stripToDigits(displayValue);
    const parsed = digits === "" ? NaN : Number(digits);
    const nextRaw = Number.isFinite(parsed) ? parsed : min;
    const next = clampLocal(nextRaw);

    onChange(next);
    setDisplayValue(formatWithGrouping(next));
  }, [formatWithCommas, displayValue, min, clampLocal, onChange]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextStr = e.target.value;

      if (!formatWithCommas) {
        onChange(Number(nextStr));
        return;
      }

      const digits = stripToDigits(nextStr);
      setDisplayValue(digits);

      // Allow empty while typing; commit on blur.
      if (digits === "") return;

      const parsed = Number(digits);
      if (!Number.isFinite(parsed)) return;

      // Avoid "min clamp jump" while the user is still typing (e.g. dealSize min=100).
      const minDigits = String(min).length;
      if (parsed < min && digits.length < minDigits) return;

      // Commit live when it looks like a real number; clamp upper bound immediately.
      if (parsed > max) {
        onChange(max);
        return;
      }

      onChange(parsed);
    },
    [formatWithCommas, min, max, onChange]
  );

  const onInc = React.useCallback(() => {
    if (formatWithCommas) stepperCommitRef.current = true;
    inc();
  }, [inc, formatWithCommas]);

  const onDec = React.useCallback(() => {
    if (formatWithCommas) stepperCommitRef.current = true;
    dec();
  }, [dec, formatWithCommas]);

  return (
    <div className={`${className ? className + ' ' : ''}relative`} suppressHydrationWarning>
      <input
        type={formatWithCommas ? "text" : "number"}
        inputMode="numeric"
        autoComplete="off"
        id={id}
        className={
          usesCustomLayout
            ? undefined
            : "w-full px-3 py-3 text-base font-bold rounded-lg border border-input bg-background text-foreground outline-none appearance-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        }
        pattern={formatWithCommas ? "[0-9,]*" : undefined}
        value={formatWithCommas ? displayValue : value}
        min={min}
        max={max}
        onChange={handleChange}
        onFocus={formatWithCommas ? handleFocus : undefined}
        onBlur={formatWithCommas ? handleBlur : undefined}
        {...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {})}
        suppressHydrationWarning
        data-dashlane-ignore="true"
        data-1p-ignore
        data-lpignore="true"
      />
      {usesCustomLayout ? (
        <div data-stepper suppressHydrationWarning>
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
            <ChevronUp aria-hidden="true" size={14} />
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
            <ChevronDown aria-hidden="true" size={14} />
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

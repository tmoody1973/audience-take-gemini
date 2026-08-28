import React, { forwardRef } from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-mono font-extrabold text-ink uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            "w-full rounded-none bg-field-paper border-2 border-ink px-3.5 py-3 text-sm font-sans text-ink placeholder:text-muted-ink/70 transition-all h-[54px]",
            error && "border-error-red bg-error-red/5",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error-red font-mono font-bold mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted-ink font-mono mt-0.5">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

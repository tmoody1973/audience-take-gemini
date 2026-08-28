import React, { forwardRef } from "react";
import { clsx } from "clsx";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-mono font-extrabold text-ink uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={clsx(
            "w-full rounded-none bg-field-paper border-2 border-ink p-3.5 text-sm font-sans text-ink placeholder:text-muted-ink/70 transition-all resize-y",
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

Textarea.displayName = "Textarea";

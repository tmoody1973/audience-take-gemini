import React, { forwardRef } from "react";
import { clsx } from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "coral" | "destructive" | "yellow";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-headline uppercase tracking-wider transition-all duration-100 rounded-none disabled:opacity-50 disabled:cursor-not-allowed select-none border-3 border-ink";

    const sizeStyles = {
      sm: "text-lg px-3 py-1 h-[42px] gap-1.5",
      md: "text-2xl px-5 h-[56px] gap-2",
      lg: "text-3xl px-6 h-[62px] gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-signal-coral text-white hover:bg-electric-blue active:translate-x-[2px] active:translate-y-[2px] shadow-action-lift active:shadow-none",
      coral:
        "bg-signal-coral text-white hover:bg-electric-blue active:translate-x-[2px] active:translate-y-[2px] shadow-action-lift active:shadow-none",
      secondary:
        "bg-transparent text-ink hover:bg-ink hover:text-white active:bg-ink active:text-white shadow-action-lift",
      outline:
        "bg-field-paper text-ink border-ink hover:bg-acid-yellow hover:text-ink active:translate-x-[2px] active:translate-y-[2px] shadow-selected-lift",
      yellow:
        "bg-acid-yellow text-ink hover:bg-ink hover:text-white shadow-action-lift",
      ghost:
        "bg-transparent text-ink border-transparent hover:bg-acid-yellow/50 shadow-none",
      destructive:
        "bg-error-red text-white hover:bg-ink shadow-action-lift",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

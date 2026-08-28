import React from "react";
import { clsx } from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "editorial" | "highlight" | "glass";
  children: React.ReactNode;
}

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-surface border border-surface-border text-text-primary rounded-md shadow-editorial",
    editorial: "bg-surface border-2 border-surface-border hover:border-cinema-gold/60 transition-colors text-text-primary rounded-none p-5 shadow-editorial",
    highlight: "bg-surface border border-cinema-gold/40 shadow-highlight text-text-primary rounded-md p-6",
    glass: "bg-surface/80 backdrop-blur-md border border-surface-border/60 text-text-primary rounded-md",
  };

  return (
    <div className={clsx(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("flex flex-col space-y-1.5 pb-4 border-b border-surface-border/80", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx("font-serif text-xl font-bold tracking-tight text-text-primary", className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx("text-sm text-text-secondary leading-relaxed", className)} {...props}>{children}</p>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("pt-4", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("flex items-center pt-4 border-t border-surface-border/80 mt-4", className)} {...props}>{children}</div>;
}

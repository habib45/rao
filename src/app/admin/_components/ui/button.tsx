import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/app/admin/_lib/cn";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-surface text-foreground border border-border hover:bg-border/50",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-muted hover:bg-surface hover:text-foreground",
  outline: "border border-border text-foreground hover:bg-surface",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-6 text-sm",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

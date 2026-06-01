import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "lg" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const sizeClasses: Record<ButtonSize, string> = {
  lg: "px-6 py-3 text-base",
  md: "px-5 py-2.5 text-sm",
  sm: "px-4 py-2 text-xs",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-sui hover:bg-sui-hover text-white hover:shadow-[0_4px_80px_8px_rgba(77,162,255,0.12)]",
  secondary:
    "bg-[#1A1A1A] text-text-muted hover:text-text outline outline-1 outline-text/5 hover:bg-card-hover",
  ghost:
    "text-text-muted hover:text-text hover:bg-card-hover",
  danger:
    "bg-loss/10 hover:bg-loss/20 text-loss",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-full font-medium transition-all duration-300 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "lg" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "rounded-full font-medium transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes: Record<ButtonSize, string> = {
    lg: "px-6 py-3 text-sm",
    md: "px-5 py-2 text-xs",
    sm: "px-4 py-1.5 text-[10px]",
  };

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-sui hover:bg-sui-hover text-white hover:shadow-[0_4px_80px_8px_rgba(77,162,255,0.12)]",
    secondary:
      "bg-[#1A1A1A] border border-text/5 text-text-muted hover:text-text hover:bg-card-hover hover:border-text/10",
    ghost:
      "text-text-muted hover:text-text hover:bg-card-hover",
    danger:
      "bg-loss/10 hover:bg-loss/20 text-loss border border-transparent",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

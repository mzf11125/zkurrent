import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  highlight?: "sui" | "profit" | "loss";
  onClick?: () => void;
}

export function Card({ children, className = "", highlight, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-3xl p-6 md:p-8 border transition-colors duration-300 ${
        onClick ? "cursor-pointer hover:bg-card-hover" : ""
      } ${
        highlight === "sui" ? "border-sui/20 hover:border-sui/30" :
        highlight === "profit" ? "border-profit/20 hover:border-profit/30" :
        highlight === "loss" ? "border-loss/20 hover:border-loss/30" :
        "border-text/5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

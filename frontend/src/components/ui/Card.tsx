import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  highlight?: "sui" | "profit" | "loss";
  onClick?: () => void;
}

const highlightClasses = {
  sui: "ring-1 ring-sui/20",
  profit: "ring-1 ring-profit/20",
  loss: "ring-1 ring-loss/20",
};

export function Card({ children, className = "", highlight, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-3xl p-6 md:p-8 outline outline-1 outline-text/5 transition-colors duration-300 ${onClick ? "cursor-pointer hover:bg-card-hover" : ""} ${highlight ? highlightClasses[highlight] : ""} ${className}`}
    >
      {children}
    </div>
  );
}

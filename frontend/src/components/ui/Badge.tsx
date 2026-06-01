type BadgeVariant = "sui" | "profit" | "loss" | "deepbook" | "cetus" | "turbos" | "neutral";

const variants: Record<BadgeVariant, string> = {
  sui: "text-sui bg-sui/10",
  profit: "text-profit bg-profit/10",
  loss: "text-loss bg-loss/10",
  deepbook: "text-deepbook bg-deepbook/10",
  cetus: "text-cetus bg-cetus/10",
  turbos: "text-turbos bg-turbos/10",
  neutral: "text-text-muted bg-text/5",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: string;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  gradient?: boolean;
  trend?: "up" | "down";
}

export function MetricCard({ label, value, gradient, trend }: MetricCardProps) {
  return (
    <div className="bg-card rounded-3xl p-6 outline outline-1 outline-text/5">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
        {label}
      </span>
      <p
        className={`mt-2 text-4xl font-black ${gradient ? "text-gradient" : trend === "up" ? "text-profit" : trend === "down" ? "text-loss" : "text-text"}`}
      >
        {value}
      </p>
    </div>
  );
}

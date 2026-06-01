import { Card } from "../ui/Card.js";
import { Badge } from "../ui/Badge.js";

const ACTIVITIES = [
  { time: "2m ago", text: "Screened 14 pools across 3 DEXes", type: "screen" as const },
  { time: "5m ago", text: "Closed DeepBook ETH/SUI | Net: +$320.50", type: "close" as const },
  { time: "8m ago", text: "Generated ZK strategy proof on Midnight", type: "zk" as const },
  { time: "12m ago", text: "Opened Turbos SUI/USDC @ [1.10, 1.40]", type: "open" as const },
  { time: "15m ago", text: "Rebalanced Cetus SUI/USDC — IL threshold", type: "rebalance" as const },
  { time: "20m ago", text: "Screened 12 pools — top: Cetus SUI/USDC (22.1%)", type: "screen" as const },
];

const typeBadge: Record<string, "sui" | "profit" | "loss" | "neutral"> = {
  screen: "sui",
  open: "sui",
  close: "loss",
  rebalance: "sui",
  zk: "profit",
};

export function ActivityFeed() {
  return (
    <Card className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
      {ACTIVITIES.map((a, i) => (
        <div key={i} className="flex items-start gap-3 pb-4 border-b border-text/5 last:border-0 last:pb-0">
          <Badge variant={typeBadge[a.type]}>{a.type}</Badge>
          <div>
            <p className="text-sm text-text">{a.text}</p>
            <p className="text-xs text-text-muted mt-0.5">{a.time}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}

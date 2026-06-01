import { MetricCard } from "../ui/MetricCard.js";
import { Card } from "../ui/Card.js";

export function AgentStatusBar() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="p-4 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-sui animate-pulse-glow flex-shrink-0" />
        <div>
          <p className="text-xs text-text-muted uppercase tracking-[0.2em]">Status</p>
          <p className="text-sm font-semibold text-sui">Online</p>
        </div>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-text-muted uppercase tracking-[0.2em]">Positions</p>
        <p className="text-sm font-semibold text-text">7 Active</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-text-muted uppercase tracking-[0.2em]">Last Cycle</p>
        <p className="text-sm font-semibold text-text">32s ago</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-text-muted uppercase tracking-[0.2em]">ZK Proofs</p>
        <p className="text-sm font-semibold text-profit">24 Verified</p>
      </Card>
    </div>
  );
}

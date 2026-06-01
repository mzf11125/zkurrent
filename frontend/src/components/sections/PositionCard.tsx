import { Badge } from "../ui/Badge.js";
import { Button } from "../ui/Button.js";
import { X } from "lucide-react";

interface PositionCardProps {
  id: string;
  pool: string;
  dex: "deepbook" | "cetus" | "turbos";
  fees: number;
  il: number;
  net: number;
  range: string;
  status: "active" | "closed";
}

export function PositionCard({ pool, dex, fees, il, net, range, status }: PositionCardProps) {
  return (
    <div className="bg-card rounded-3xl p-6 border border-text/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant={dex}>{dex}</Badge>
          <span className="text-text font-semibold">{pool}</span>
        </div>
        <Badge variant={status === "active" ? "sui" : "neutral"}>
          {status}
        </Badge>
      </div>

      <div className="mb-4">
        <span className="text-xs text-text-muted uppercase tracking-[0.2em]">Range</span>
        <p className="text-text font-mono text-sm mt-1">{range}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <span className="text-xs text-text-muted">Fees</span>
          <p className="text-profit font-mono text-sm mt-0.5">+${fees.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-xs text-text-muted">IL</span>
          <p className="text-loss font-mono text-sm mt-0.5">-${Math.abs(il).toLocaleString()}</p>
        </div>
        <div>
          <span className="text-xs text-text-muted">Net PnL</span>
          <p className={`font-mono text-sm mt-0.5 ${net >= 0 ? "text-profit" : "text-loss"}`}>
            {net >= 0 ? "+" : "-"}${Math.abs(net).toLocaleString()}
          </p>
        </div>
      </div>

      {status === "active" && (
        <Button variant="danger" size="sm" className="mt-4 w-full">
          <X className="w-3 h-3" /> Close Position
        </Button>
      )}
    </div>
  );
}

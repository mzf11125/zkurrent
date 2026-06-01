import { motion } from "framer-motion";
import { Card } from "../ui/Card.js";
import { Button } from "../ui/Button.js";
import { Badge } from "../ui/Badge.js";
import { Save } from "lucide-react";

const ease = [0.16, 1, 0.3, 1];

export function StrategyPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease as never } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text">Strategy</h1>
            <p className="mt-1 text-sm text-text-muted">Configure your agent's behavior</p>
          </div>
          <Button size="sm">
            <Save className="w-3 h-3" /> Save Config
          </Button>
        </div>
      </motion.div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {/* Agent Status */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text">Agent Status</h3>
            <Badge variant="sui">Running</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-sui animate-pulse-glow" />
            <span className="text-text">Agent is active — screening pools every 5 minutes</span>
          </div>
        </Card>

        {/* Risk Params */}
        <Card>
          <h3 className="text-lg font-semibold text-text mb-6">Risk Parameters</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Risk Tolerance</span>
                <span className="text-sui font-semibold">65 / 100</span>
              </div>
              <div className="w-full h-2 bg-input rounded-full overflow-hidden">
                <div className="h-full bg-sui rounded-full" style={{ width: "65%" }} />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Target APY</label>
                <div className="mt-1 bg-input rounded-xl px-4 py-3 text-text font-mono">15.0%</div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Max IL</label>
                <div className="mt-1 bg-input rounded-xl px-4 py-3 text-text font-mono">5.0%</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pool Allowlist */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-text mb-6">Pool Allowlist</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { pool: "SUI/USDC", dex: "deepbook" as const, checked: true },
              { pool: "SUI/USDC", dex: "cetus" as const, checked: true },
              { pool: "ETH/SUI", dex: "deepbook" as const, checked: true },
              { pool: "SUI/USDC", dex: "turbos" as const, checked: true },
              { pool: "BTC/SUI", dex: "deepbook" as const, checked: false },
              { pool: "ETH/USDC", dex: "cetus" as const, checked: false },
            ].map((p) => (
              <div
                key={`${p.dex}-${p.pool}`}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${p.checked ? "bg-sui/5 border border-sui/20" : "bg-input opacity-50"}`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={p.dex}>{p.dex}</Badge>
                  <span className="text-sm text-text">{p.pool}</span>
                </div>
                <span className={`text-xs ${p.checked ? "text-sui" : "text-text-muted"}`}>
                  {p.checked ? "Allowed" : "Blocked"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

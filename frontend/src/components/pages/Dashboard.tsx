import { motion } from "framer-motion";
import { MetricCard } from "../ui/MetricCard.js";
import { Card } from "../ui/Card.js";
import { Badge } from "../ui/Badge.js";
import { AgentStatusBar } from "../sections/AgentStatusBar.js";
import { PositionCard } from "../sections/PositionCard.js";
import { ActivityFeed } from "../sections/ActivityFeed.js";

const ease = [0.16, 1, 0.3, 1];

const MOCK_POSITIONS = [
  { id: "1", pool: "SUI/USDC", dex: "cetus" as const, fees: 320.50, il: -45.20, net: 275.30, range: "1.20 — 1.50", status: "active" as const },
  { id: "2", pool: "ETH/SUI", dex: "deepbook" as const, fees: 180.75, il: -12.40, net: 168.35, range: "0.85 — 1.10", status: "active" as const },
  { id: "3", pool: "SUI/USDC", dex: "turbos" as const, fees: 520.00, il: -80.00, net: 440.00, range: "1.10 — 1.40", status: "active" as const },
];

export function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease as never } }}
      >
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Agent overview and live metrics</p>
      </motion.div>

      {/* Agent Status Bar */}
      <div className="mt-8">
        <AgentStatusBar />
      </div>

      {/* Metrics Grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Positions" value="7" />
        <MetricCard label="Total TVL" value="$842K" />
        <MetricCard label="Cumulative PnL" value="+$4,250.50" gradient />
        <MetricCard label="Current APY" value="14.2%" trend="up" />
      </div>

      {/* Main content grid */}
      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        {/* Positions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text">Active Positions</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {MOCK_POSITIONS.map((pos, i) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as never } }}
              >
                <PositionCard {...pos} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Activity</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

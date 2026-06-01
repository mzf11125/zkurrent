import { motion } from "framer-motion";
import { PositionCard } from "../sections/PositionCard.js";

const ease = [0.16, 1, 0.3, 1];

const ACTIVE_POSITIONS = [
  { id: "pos-1", pool: "SUI/USDC", dex: "cetus" as const, fees: 320.50, il: -45.20, net: 275.30, range: "1.20 — 1.50", status: "active" as const },
  { id: "pos-2", pool: "ETH/SUI", dex: "deepbook" as const, fees: 180.75, il: -12.40, net: 168.35, range: "0.85 — 1.10", status: "active" as const },
  { id: "pos-3", pool: "SUI/USDC", dex: "turbos" as const, fees: 520.00, il: -80.00, net: 440.00, range: "1.10 — 1.40", status: "active" as const },
];

const CLOSED_POSITIONS = [
  { id: "pos-4", pool: "BTC/SUI", dex: "deepbook" as const, fees: 145.30, il: -20.10, net: 125.20, range: "0.90 — 1.15", status: "closed" as const },
  { id: "pos-5", pool: "SUI/USDC", dex: "cetus" as const, fees: 260.00, il: -55.00, net: 205.00, range: "1.05 — 1.35", status: "closed" as const },
];

export function PositionsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease as never } }}
      >
        <h1 className="text-2xl font-semibold text-text">Positions</h1>
        <p className="mt-1 text-sm text-text-muted">Active and closed LP positions</p>
      </motion.div>

      <div className="mt-8 space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">
            Active <span className="text-sui">({ACTIVE_POSITIONS.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACTIVE_POSITIONS.map((pos, i) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease } }}
              >
                <PositionCard {...pos} />
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text mb-4">
            Closed <span className="text-text-muted">({CLOSED_POSITIONS.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {CLOSED_POSITIONS.map((pos, i) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease } }}
              >
                <PositionCard {...pos} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

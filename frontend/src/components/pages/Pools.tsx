import { motion } from "framer-motion";
import { Badge } from "../ui/Badge.js";
import { Button } from "../ui/Button.js";
import { RefreshCw } from "lucide-react";

const ease = [0.16, 1, 0.3, 1];

const MOCK_POOLS = [
  { pool: "SUI/USDC", dex: "deepbook" as const, tvl: "$12.5M", volume: "$842K", apy: "14.2%", score: 94 },
  { pool: "ETH/SUI", dex: "deepbook" as const, tvl: "$8.2M", volume: "$620K", apy: "11.8%", score: 87 },
  { pool: "SUI/USDC", dex: "cetus" as const, tvl: "$5.1M", volume: "$310K", apy: "18.5%", score: 82 },
  { pool: "BTC/SUI", dex: "deepbook" as const, tvl: "$3.8M", volume: "$195K", apy: "9.2%", score: 71 },
  { pool: "SUI/USDT", dex: "turbos" as const, tvl: "$2.9M", volume: "$140K", apy: "22.1%", score: 68 },
  { pool: "ETH/USDC", dex: "cetus" as const, tvl: "$4.5M", volume: "$275K", apy: "10.7%", score: 65 },
];

export function PoolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease as never } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text">Pool Screener</h1>
            <p className="mt-1 text-sm text-text-muted">Ranked by composite score (TVL + Volume + APY)</p>
          </div>
          <Button size="sm">
            <RefreshCw className="w-3 h-3" /> Screen Now
          </Button>
        </div>
      </motion.div>

      <div className="mt-8 bg-card rounded-3xl border border-text/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-[0.2em] border-b border-text/5">
              <th className="text-left py-4 px-6 font-medium">Pool</th>
              <th className="text-right py-4 px-4 font-medium">TVL</th>
              <th className="text-right py-4 px-4 font-medium hidden md:table-cell">24h Volume</th>
              <th className="text-right py-4 px-4 font-medium">APY</th>
              <th className="text-right py-4 px-6 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_POOLS.map((pool) => (
              <tr
                key={`${pool.dex}-${pool.pool}`}
                className="border-b border-text/5 hover:bg-card-hover transition-colors"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <Badge variant={pool.dex as "deepbook" | "cetus" | "turbos"}>
                      {pool.dex}
                    </Badge>
                    <span className="text-text font-medium">{pool.pool}</span>
                  </div>
                </td>
                <td className="text-right py-4 px-4 text-text-secondary font-mono">{pool.tvl}</td>
                <td className="text-right py-4 px-4 text-text-secondary font-mono hidden md:table-cell">{pool.volume}</td>
                <td className="text-right py-4 px-4 text-profit font-mono">{pool.apy}</td>
                <td className="text-right py-4 px-6">
                  <span className="text-sui font-semibold">{pool.score}</span>
                  <span className="text-text-muted">/100</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

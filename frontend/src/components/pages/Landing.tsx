import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Waves, TrendingUp, Shield, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button.js";
import { Card } from "../ui/Card.js";
import { Badge } from "../ui/Badge.js";
import { Navbar } from "../layout/Navbar.js";

import { type Transition, type Variants } from "framer-motion";

const ease: Transition["ease"] = [0.16, 1, 0.3, 1] as never;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as never },
  }),
};

const FEATURES = [
  { icon: Zap, title: "Autonomous LP Agent", description: "Screens DeepBook, Cetus, and Turbos pools. Opens, manages, and rebalances positions without human intervention.", badge: "Agentic Web" },
  { icon: Shield, title: "ZK-Verified Performance", description: "Zero-knowledge proofs on Midnight Network attest to strategy compliance and verifiable PnL — without revealing positions.", badge: "Midnight ZK" },
  { icon: TrendingUp, title: "Deep Learning Loop", description: "Records win/loss per pool. Weights future decisions. Improves over time. Powered by DeepSeek V4 Pro via LangChain.", badge: "AI Native" },
  { icon: Waves, title: "Multi-DEX Coverage", description: "DeepBook orderbook. Cetus CLMM. Turbos concentrated liquidity. One agent, three DEXes, optimal allocation.", badge: "Sui Native" },
];

const STEPS = [
  { step: "1", title: "Deposit SUI", description: "Fund your agent wallet. Tidal starts screening pools." },
  { step: "2", title: "Configure Strategy", description: "Set risk tolerance, target APY, and max impermanent loss." },
  { step: "3", title: "Agent Opens Position", description: "ZKurrent selects the best pool across DeepBook, Cetus, and Turbos." },
  { step: "4", title: "Prove & Earn", description: "ZK proofs attest to performance. Fees accumulate. Strategy improves." },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-bg">
      <div className="cinematic-orb orb-1" />
      <div className="cinematic-orb orb-2" />
      <div className="cinematic-orb orb-3" />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="sui">Sui Overflow 2026</Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-6 text-5xl md:text-7xl font-medium text-text leading-[1.1]"
            >
              Autonomous LP Agent
              <br />
              <span className="text-gradient">Zero-Knowledge Verified</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
            >
              ZKurrent screens pools, opens positions, proves strategy compliance
              via Midnight ZK proofs, and learns from every trade — autonomously on
              Sui.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-10 flex items-center justify-center gap-4 flex-wrap"
            >
              <Link to="/dashboard">
                <Button size="lg">
                  Launch App <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="https://github.com/mzf11125/zkurrent" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary">
                  View on GitHub
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Trusted by */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.2, duration: 0.6 } }}
            className="mt-16 flex items-center justify-center gap-8 text-text-muted text-xs uppercase tracking-[0.2em]"
          >
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-deepbook" /> DeepBook V3</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cetus" /> Cetus CLMM</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-turbos" /> Turbos</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sui" /> Midnight ZK</span>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as never } }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-medium text-text">Why ZKurrent</h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              Meridian for Sui — with ZK proofs. Autonomous LP management across
              three DEXes, verifiable on Midnight.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as never } }}
                viewport={{ once: true }}
              >
                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sui/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-sui" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-text">{f.title}</h3>
                        <Badge variant="sui">{f.badge}</Badge>
                      </div>
                      <p className="text-sm text-text-secondary">{f.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as never } }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-medium text-text text-center mb-16"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as never } }}
                viewport={{ once: true }}
              >
                <Card className="text-center">
                  <div className="w-10 h-10 rounded-full bg-sui/10 text-sui flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-semibold text-text mb-2">{s.title}</h3>
                  <p className="text-sm text-text-secondary">{s.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { label: "DEXes", value: "3", trend: "up" as const },
              { label: "ZK Circuits", value: "2", trend: "up" as const },
              { label: "Target APY", value: "15%+", trend: "up" as const },
              { label: "Agent Tracks", value: "3", trend: "up" as const },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-black text-gradient">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-32 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as never } }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-medium text-text">
            Ready to deploy autonomous liquidity?
          </h2>
          <p className="mt-4 text-text-secondary max-w-lg mx-auto">
            One agent. Three DEXes. ZK-verified performance on Midnight.
          </p>
          <div className="mt-10">
            <Link to="/dashboard">
              <Button size="lg">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-text/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-sui to-profit" />
            <span className="text-text-muted text-sm">ZKurrent — Sui Overflow 2026</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <a href="https://github.com/mzf11125/zkurrent" className="hover:text-text transition-colors">GitHub</a>
            <a href="https://zkurrent.xyz" className="hover:text-text transition-colors">zkurrent.xyz</a>
            <span className="text-text-dim">Apache 2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

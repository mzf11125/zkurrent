import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Waves, TrendingUp, Shield, Zap, ArrowRight } from "lucide-react";
import { Card } from "../ui/Card.js";
import { Badge } from "../ui/Badge.js";
import { Navbar } from "../layout/Navbar.js";
import { WordsPullUp } from "../WordsPullUp.js";
import { BlurIn } from "../BlurIn.js";


const FEATURES = [
  { icon: Zap, title: "Autonomous LP Agent", description: "Screens DeepBook, Cetus, and Turbos pools. Opens, manages, and rebalances positions without human intervention.", badge: "Agentic Web" },
  { icon: Shield, title: "Bastion Agentic Defense", description: "4-layer security: input sanitization, per-agent policy engine, ZK circuit enforcement on Midnight, and immutable decision audit trail — no prompt injection can breach position limits.", badge: "Secure AI" },
  { icon: TrendingUp, title: "Deep Learning Loop", description: "Records win/loss per pool. Weights future decisions. Improves over time. Powered by DeepSeek V4 Pro via LangChain.", badge: "AI Native" },
  { icon: Waves, title: "Multi-DEX Coverage", description: "DeepBook orderbook. Cetus CLMM & DLMM. Turbos concentrated liquidity. One agent, four DEX types, unified execution.", badge: "Sui Native" },
];

const STEPS = [
  { step: "1", title: "Deposit SUI", description: "Fund your agent wallet. Tidal starts screening pools." },
  { step: "2", title: "Configure Strategy", description: "Set risk tolerance, target APY, and max impermanent loss." },
  { step: "3", title: "Agent Opens Position", description: "ZKurrent selects the best pool across DeepBook, Cetus, and Turbos." },
  { step: "4", title: "Prove & Earn", description: "ZK proofs attest to performance. Fees accumulate. Strategy improves." },
];

export function LandingPage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="relative min-h-screen bg-bg">
      <div className="cinematic-orb orb-1" />
      <div className="cinematic-orb orb-2" />
      <div className="cinematic-orb orb-3" />
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: "linear-gradient(to bottom, rgba(0,4,31,0.65) 0%, rgba(0,4,31,0.4) 40%, rgba(0,4,31,0.85) 100%)" }}
      />
      {/* KREDZ noise texture */}
      <svg className="fixed inset-0 w-full h-full z-[2] pointer-events-none" style={{ mixBlendMode: "overlay", opacity: 0.7 }}>
        <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter>
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.3"/>
      </svg>
      <Navbar />

      {/* ── Hero — full viewport, centered ── */}
      <section className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-4 md:px-6 overflow-hidden">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <h1 className="text-[clamp(2.5rem,8vw,8rem)] font-medium text-text leading-[0.95] tracking-[-0.04em]">
            <WordsPullUp
              text="The Autonomous Liquidity Current"
              gradientWords={["Autonomous", "Liquidity", "Current"]}
            />
          </h1>

          <BlurIn className="mt-6 md:mt-8">
            <p className="text-base md:text-xl text-text-secondary max-w-xl md:max-w-2xl mx-auto leading-relaxed px-2">
              ZKurrent screens pools, opens positions, proves strategy compliance
              via Midnight ZK proofs, and learns from every trade — autonomously.
            </p>
          </BlurIn>

          <BlurIn duration={1.4} className="mt-10 md:mt-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <button className="glow-btn w-full sm:w-auto rounded-full bg-sui hover:bg-sui-hover text-white font-medium text-sm px-8 py-3.5 transition-all duration-300 inline-flex items-center justify-center gap-2">
                  Launch App <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href="https://github.com/mzf11125/zkurrent" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto rounded-full bg-[#1A1A1A] border border-text/5 text-text-muted hover:text-text hover:bg-card-hover hover:border-text/10 font-medium text-sm px-8 py-3.5 transition-all duration-200">
                  View on GitHub
                </button>
              </a>
            </div>
          </BlurIn>

          {/* Trusted by */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.2, duration: 0.8 } }}
            className="mt-16 md:mt-20 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-text-muted text-[10px] md:text-xs uppercase tracking-[0.2em]"
          >
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-deepbook" /> DeepBook V3</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cetus" /> Cetus CLMM</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#E879F9]" /> Cetus DLMM</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-turbos" /> Turbos</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sui" /> Midnight ZK</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-20 md:py-28 px-4 md:px-6 border-t border-text/5">
        <div className="max-w-6xl mx-auto">
          <BlurIn className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-medium text-text">Why ZKurrent</h2>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-text-secondary max-w-xl mx-auto">
              Autonomous LP management across four DEX types — orderbook, CLMM, DLMM — with ZK proofs on Midnight.
            </p>
          </BlurIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
      <section className="relative z-10 py-20 md:py-28 px-4 md:px-6 border-t border-text/5">
        <div className="max-w-6xl mx-auto">
          <BlurIn className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-medium text-text">How It Works</h2>
          </BlurIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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

      {/* ── Two Ways to Use ── */}
      <section className="relative z-10 py-20 md:py-28 px-4 md:px-6 border-t border-text/5">
        <div className="max-w-6xl mx-auto">
          <BlurIn className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-medium text-text">Two Ways to Use ZKurrent</h2>
          </BlurIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as never } }}
              viewport={{ once: true }}
            >
              <Card highlight="sui">
                <div className="w-12 h-12 rounded-2xl bg-sui/10 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-sui" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-3">For Traders</h3>
                <Badge variant="sui">Turnkey Agent</Badge>
                <p className="mt-4 text-sm text-text-secondary">
                  Deploy a fully autonomous LP agent in one click. It screens
                  DeepBook, Cetus & Turbos pools, opens positions, manages PnL,
                  and proves performance via Midnight ZK proofs. No code needed.
                </p>
                <div className="mt-6 text-xs text-text-muted space-y-2">
                  <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-sui" /> Auto-screening across 3 DEXes</span>
                  <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-sui" /> ZK-verified performance on Midnight</span>
                  <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-sui" /> DeepSeek V4 Pro powered decisions</span>
                </div>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as never } }}
              viewport={{ once: true }}
            >
              <Card highlight="profit">
                <div className="w-12 h-12 rounded-2xl bg-profit/10 flex items-center justify-center mb-6">
                  <Waves className="w-6 h-6 text-profit" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-3">For Builders</h3>
                <Badge variant="profit">SDK & API</Badge>
                <p className="mt-4 text-sm text-text-secondary">
                  Integrate ZKurrent's ZK-shielded execution rails into your own
                  AI agents and trading bots. x402 micropayments in SUI. No API
                  keys. No sign-ups. Pure machine-to-machine economy.
                </p>
                <div className="mt-6 text-xs text-text-muted space-y-2">
                  <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-profit" /> x402 M2M payments (0.005–0.02 SUI/call)</span>
                  <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-profit" /> DeepBook routing + ZK proof verification</span>
                  <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-profit" /> SDK available for TypeScript agents</span>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 py-20 md:py-28 px-4 md:px-6 bg-card/30 border-t border-text/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "DEXes", value: "4", trend: "up" as const },
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
      <section className="relative z-10 py-24 md:py-36 px-4 md:px-6 text-center border-t border-text/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as never } }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-5xl font-medium text-text">
            Ready to deploy autonomous liquidity?
          </h2>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-text-secondary max-w-lg mx-auto">
            One agent. Three DEXes. ZK-verified performance on Midnight.
          </p>
          <div className="mt-8 md:mt-10">
            <Link to="/dashboard">
              <button className="glow-btn rounded-full bg-sui hover:bg-sui-hover text-white font-medium text-sm px-8 py-3.5 transition-all duration-300 inline-flex items-center gap-2">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-text/5 py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-sui to-profit" />
            <span className="text-text-muted text-xs md:text-sm">ZKurrent — Sui Overflow 2026</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] md:text-xs text-text-muted">
            <a href="https://github.com/mzf11125/zkurrent" className="hover:text-text transition-colors">GitHub</a>
            <a href="https://zkurrent.xyz" className="hover:text-text transition-colors">zkurrent.xyz</a>
            <span className="text-text-dim">Apache 2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

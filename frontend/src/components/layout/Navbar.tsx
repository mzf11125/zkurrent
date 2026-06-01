import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/pools", label: "Pools" },
  { to: "/positions", label: "Positions" },
  { to: "/strategy", label: "Strategy" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [midnightStatus, setMidnightStatus] = useState<"detected" | "missing">("missing");
  const isLanding = pathname === "/";

  useEffect(() => {
    const check = () => {
      const m = (window as Record<string, unknown>).midnight as Record<string, unknown> | undefined;
      setMidnightStatus(m?.["1am"] ? "detected" : "missing");
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#000510]/95 backdrop-blur-md border-b border-text/5">
      <div className="max-w-6xl mx-auto px-4 md:px-12 py-3 md:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-sui to-profit flex items-center justify-center">
            <span className="text-black font-black text-[10px]">ZK</span>
          </div>
          <span className="text-text font-semibold text-sm">zkurrent</span>
        </Link>

        {/* Center pill — hidden on landing */}
        {!isLanding && (
          <div className="hidden md:flex bg-black rounded-full px-2 py-1.5 gap-0.5 border border-text/5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-200 ${
                  pathname === item.to
                    ? "bg-sui text-black"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 1AM Midnight wallet status */}
          {!isLanding && (
            <span
              className="hidden md:flex items-center gap-1.5 text-[10px] text-text-muted"
              title={midnightStatus === "detected" ? "1AM wallet connected" : "1AM wallet not detected"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  midnightStatus === "detected" ? "bg-profit animate-pulse-glow" : "bg-text-dim"
                }`}
              />
              <span className="hidden lg:inline">{midnightStatus === "detected" ? "1AM" : "No ZK"}</span>
            </span>
          )}

          {/* Sui wallet + launch */}
          {isLanding ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-sui hover:bg-sui-hover text-white font-medium text-xs px-5 py-2 transition-colors"
            >
              Launch App
            </Link>
          ) : (
            <div className="scale-[0.85] origin-right">
              <ConnectButton />
            </div>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-text-muted hover:text-text transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="bg-[#111] rounded-2xl p-4 flex flex-col gap-1 border border-text/5">
            {(!isLanding ? NAV_ITEMS : [{ to: "/dashboard", label: "Launch App" }]).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.2em] transition-all ${
                  pathname === item.to
                    ? "bg-sui/10 text-sui"
                    : "text-text-muted hover:text-text hover:bg-card-hover"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

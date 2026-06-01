import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/Button.js";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/pools", label: "Pools" },
  { to: "/positions", label: "Positions" },
  { to: "/strategy", label: "Strategy" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  return (
    <nav className="glass fixed top-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sui to-profit flex items-center justify-center">
            <span className="text-black font-black text-xs">ZK</span>
          </div>
          <span className="text-text font-semibold text-base">zkurrent</span>
        </Link>

        {!isLanding && (
          <div className="hidden md:flex bg-black rounded-full px-2 py-1.5 gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] transition-all ${
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

        <div className="flex items-center gap-3">
          {isLanding ? (
            <Link to="/dashboard">
              <Button size="sm">Launch App</Button>
            </Link>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-sui animate-pulse-glow hidden md:block" />
              <Button size="sm" variant="secondary">Connect Wallet</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

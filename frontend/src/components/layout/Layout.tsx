import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar.js";

export function Layout() {
  return (
    <div className="relative min-h-screen bg-bg">
      {/* KREDZ cinematic background */}
      <div className="cinematic-orb orb-1" />
      <div className="cinematic-orb orb-2" />
      <div className="cinematic-orb orb-3" />
      {/* Gradient overlay — darkens top behind navbar, matching KREDZ */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,4,31,0.65) 0%, rgba(0,4,31,0.4) 40%, rgba(0,4,31,0.85) 100%)",
        }}
      />
      <Navbar />
      <main className="relative z-10 pt-24">
        <Outlet />
      </main>
    </div>
  );
}

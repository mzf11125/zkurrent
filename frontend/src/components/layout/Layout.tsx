import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar.js";

export function Layout() {
  return (
    <div className="relative min-h-screen bg-bg">
      <div className="cinematic-orb orb-1" />
      <div className="cinematic-orb orb-2" />
      <div className="cinematic-orb orb-3" />
      <Navbar />
      <main className="relative z-10 pt-24">
        <Outlet />
      </main>
    </div>
  );
}

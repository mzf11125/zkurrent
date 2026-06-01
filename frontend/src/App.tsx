import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout.js";
import { LandingPage } from "./components/pages/Landing.js";
import { DashboardPage } from "./components/pages/Dashboard.js";
import { PoolsPage } from "./components/pages/Pools.js";
import { PositionsPage } from "./components/pages/Positions.js";
import { StrategyPage } from "./components/pages/Strategy.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pools" element={<PoolsPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/strategy" element={<StrategyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

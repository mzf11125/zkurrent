import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/layout/Layout.js";
import { LandingPage } from "./components/pages/Landing.js";
import { DashboardPage } from "./components/pages/Dashboard.js";
import { PoolsPage } from "./components/pages/Pools.js";
import { PositionsPage } from "./components/pages/Positions.js";
import { StrategyPage } from "./components/pages/Strategy.js";
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

const networks = {
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
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
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

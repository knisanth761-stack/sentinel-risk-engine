import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import CommandCenter from "./pages/CommandCenter";
import TransactionIntelligence from "./pages/TransactionIntelligence";
import RiskEvents from "./pages/RiskEvents";
import ModelIntelligence from "./pages/ModelIntelligence";
import { SessionHistoryProvider } from "./context/SessionHistoryContext";
import "./App.css";

function App() {
  return (
    <SessionHistoryProvider>
      <div className="app-shell">
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/transaction-intelligence" element={<TransactionIntelligence />} />
            <Route path="/risk-events" element={<RiskEvents />} />
            <Route path="/model-intelligence" element={<ModelIntelligence />} />
          </Routes>

          <footer className="footer">
            <span>
              <span className="status-dot" /> SENTINEL CORE OPERATIONAL
            </span>
            <span>RULE ENGINE · XGBOOST · RISK FUSION · SHAP</span>
          </footer>
        </main>
      </div>
    </SessionHistoryProvider>
  );
}

export default App;

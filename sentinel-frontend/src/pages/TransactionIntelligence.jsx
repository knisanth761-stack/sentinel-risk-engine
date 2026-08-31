import Topbar from "../components/layout/Topbar";
import TransactionForm from "../components/transaction/TransactionForm";
import TransactionIdentityStrip from "../components/transaction/TransactionIdentityStrip";
import DecisionPanel from "../components/decision/DecisionPanel";
import Metric from "../components/shared/Metric";
import ExplanationPanel from "../components/intelligence/ExplanationPanel";
import ShapPanel from "../components/intelligence/ShapPanel";
import AgreementPanel from "../components/intelligence/AgreementPanel";
import BalanceConsistencyPanel from "../components/intelligence/BalanceConsistencyPanel";
import FlowDiagram from "../components/intelligence/FlowDiagram";
import MetadataPanel from "../components/intelligence/MetadataPanel";
import { useSessionHistory } from "../context/SessionHistoryContext";
import {
  extractDecision,
  extractMlProbability,
  extractReasons,
  extractRuleScore,
  extractScore,
  extractTopFeatures,
} from "../lib/risk";
import { BrainCircuit, Database, Network, Shield } from "lucide-react";
import { formatPercent } from "../lib/format";

export default function TransactionIntelligence() {
  const { transaction, updateField, applyPreset, result, loading, error, lastRun, runAnalysis } =
    useSessionHistory();

  const decision = extractDecision(result);
  const score = extractScore(result);
  const ruleScore = extractRuleScore(result);
  const mlProbability = extractMlProbability(result);
  const reasons = extractReasons(result);
  const topFeatures = extractTopFeatures(result);

  return (
    <div className="transaction-intelligence">
      <Topbar
        eyebrow="TRANSACTION INTELLIGENCE"
        title="Analyze a Transaction"
        subtitle="Submit a transaction to the live Sentinel engine and inspect every layer of the decision."
      />

      <TransactionIdentityStrip transaction={transaction} />

      <div className="command-section-label">
        <span>TRANSACTION &amp; VERDICT</span>
      </div>

      <section className="command-grid">
        <TransactionForm
          transaction={transaction}
          updateField={updateField}
          applyPreset={applyPreset}
          onAnalyze={runAnalysis}
          loading={loading}
          error={error}
        />

        <DecisionPanel
          result={result}
          decision={decision}
          score={score}
          ruleScore={ruleScore}
          mlProbability={mlProbability}
          lastRun={lastRun}
        />
      </section>

      <div className="command-section-label">
        <span>RULE &amp; ML INTELLIGENCE</span>
      </div>

      <section className="metrics-grid">
        <Metric
          icon={<Shield size={18} />}
          label="RULE INTELLIGENCE"
          value={`${Number(ruleScore ?? 0).toFixed(0)}`}
          suffix="/100"
          description="Deterministic risk signals"
          provenance="live"
        />
        <Metric
          icon={<BrainCircuit size={18} />}
          label="ML CONFIDENCE"
          value={formatPercent(mlProbability)}
          description="XGBoost fraud probability"
          provenance="live"
        />
        <Metric
          icon={<Network size={18} />}
          label="FUSION STATUS"
          value={result ? "ACTIVE" : "READY"}
          description="Rules + machine intelligence"
          provenance="live"
        />
        <Metric
          icon={<Database size={18} />}
          label="DECISION MODE"
          value="LIVE"
          description="Connected to risk engine"
          provenance="live"
        />
      </section>

      <div className="command-section-label">
        <span>EXPLANATION</span>
      </div>

      <section className="lower-grid">
        <ExplanationPanel result={result} reasons={reasons} />
        <ShapPanel result={result} topFeatures={topFeatures} />
      </section>

      <div className="command-section-label">
        <span>CROSS-VALIDATION</span>
      </div>

      <section className="lower-grid">
        <AgreementPanel result={result} ruleScore={ruleScore} mlProbability={mlProbability} />
        <BalanceConsistencyPanel transaction={transaction} />
      </section>

      <div className="command-section-label">
        <span>TRANSACTION EVIDENCE</span>
      </div>

      <section className="lower-grid">
        <FlowDiagram transaction={transaction} />
        <MetadataPanel transaction={transaction} result={result} />
      </section>
    </div>
  );
}

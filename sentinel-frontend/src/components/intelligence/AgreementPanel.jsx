import { GitCompareArrows } from "lucide-react";
import ProvenanceTag from "../shared/ProvenanceTag";
import EmptyState from "../shared/EmptyState";
import { agreement } from "../../lib/risk";

export default function AgreementPanel({ result, ruleScore, mlProbability }) {
  if (!result) {
    return (
      <div className="panel agreement-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">05 / CONFIDENCE</span>
            <h2>Rule vs ML Agreement</h2>
          </div>
          <GitCompareArrows size={20} />
        </div>
        <EmptyState
          icon={<GitCompareArrows size={30} />}
          title="Agreement analysis ready"
          message="Compares the rule engine and ML model after analysis."
        />
      </div>
    );
  }

  const { level, diff, ruleSignal, mlSignal } = agreement(ruleScore, mlProbability);
  const levelTone = level === "ALIGNED" ? "safe" : level === "MODERATE DIVERGENCE" ? "warning" : "danger";

  return (
    <div className="panel agreement-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">05 / CONFIDENCE</span>
          <h2>Rule vs ML Agreement</h2>
        </div>
        <ProvenanceTag kind="derived" />
      </div>

      <div className={`agreement-verdict tier-${levelTone}`}>{level}</div>

      <div className="agreement-bars">
        <div className="agreement-bar-row">
          <span>RULE ENGINE SIGNAL</span>
          <div className="agreement-bar">
            <span style={{ width: `${ruleSignal * 100}%` }} />
          </div>
          <strong>{(ruleSignal * 100).toFixed(0)}%</strong>
        </div>
        <div className="agreement-bar-row">
          <span>ML MODEL SIGNAL</span>
          <div className="agreement-bar ml">
            <span style={{ width: `${mlSignal * 100}%` }} />
          </div>
          <strong>{(mlSignal * 100).toFixed(0)}%</strong>
        </div>
      </div>

      <p className="agreement-note">
        Divergence of {(diff * 100).toFixed(1)} points between normalized signals. Computed client-side from the
        real rule score and ML probability returned by this analysis.
      </p>
    </div>
  );
}

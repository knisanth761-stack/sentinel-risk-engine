import { ArrowUpRight, BrainCircuit, CheckCircle2, Sparkles } from "lucide-react";
import EmptyState from "../shared/EmptyState";

export default function ExplanationPanel({ result, reasons }) {
  return (
    <div className="panel explanation-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">03 / INTELLIGENCE</span>
          <h2>Why Sentinel Decided</h2>
        </div>
        <Sparkles size={20} />
      </div>

      {!result ? (
        <EmptyState
          icon={<BrainCircuit size={30} />}
          title="Intelligence feed ready"
          message="Run an analysis to inspect rule and ML reasoning."
        />
      ) : (
        <div className="reason-list">
          {reasons.map((reason, index) => (
            <div className="reason" key={index}>
              <div className="reason-icon">
                <ArrowUpRight size={15} />
              </div>
              <span>{reason}</span>
            </div>
          ))}

          {!reasons.length && (
            <div className="reason">
              <div className="reason-icon">
                <CheckCircle2 size={15} />
              </div>
              <span>Sentinel completed the analysis without additional explanation signals.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

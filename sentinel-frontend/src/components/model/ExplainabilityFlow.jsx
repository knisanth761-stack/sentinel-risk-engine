import { ArrowRight } from "lucide-react";

// Describes the REAL explainability pipeline already used elsewhere in
// the app (ShapPanel renders live per-transaction SHAP output; the
// fusion/explanation layer produces the human-readable reasons shown in
// Transaction Intelligence). This is a static architecture diagram —
// labels only, no numbers, so it can never be mistaken for telemetry.
const STAGES = [
  "MODEL PREDICTION",
  "FEATURE CONTRIBUTIONS",
  "SHAP ANALYSIS",
  "TOP RISK DRIVERS",
  "HUMAN-READABLE EXPLANATION",
];

export default function ExplainabilityFlow() {
  return (
    <div className="explainability-flow" role="img" aria-label="Explainability pipeline: model prediction to feature contributions to SHAP analysis to top risk drivers to human-readable explanation">
      {STAGES.map((stage, index) => (
        <div className="explainability-stage-group" key={stage}>
          <div className="explainability-stage">{stage}</div>
          {index < STAGES.length - 1 && (
            <ArrowRight size={14} className="explainability-arrow" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

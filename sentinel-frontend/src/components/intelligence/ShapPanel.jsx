import { Activity, ArrowDownRight, ArrowUpRight, BrainCircuit } from "lucide-react";
import EmptyState from "../shared/EmptyState";
import ProvenanceTag from "../shared/ProvenanceTag";
import { shapContributions } from "../../lib/risk";
import { humanizeFeature } from "../../lib/featureLabels";

export default function ShapPanel({ result, topFeatures }) {
  const withContributions = shapContributions(topFeatures);

  return (
    <div className="panel shap-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">04 / MODEL</span>
          <h2>Top ML Contributors</h2>
        </div>
        <BrainCircuit size={20} />
      </div>

      {!result ? (
        <EmptyState
          icon={<Activity size={30} />}
          title="Model telemetry ready"
          message="SHAP contributors appear after analysis."
        />
      ) : (
        <div className="feature-list">
          {withContributions.map((item, index) => {
            const impactUp = String(item.impact || "").includes("INCREASES");

            return (
              <div className="feature" key={`${item.feature}-${index}`}>
                <div className="feature-top">
                  <span title={item.feature}>{humanizeFeature(item.feature)}</span>
                  <strong className={impactUp ? "up" : "down"}>
                    {impactUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Number(item.shapValue || 0).toFixed(3)}
                  </strong>
                </div>
                <div className="feature-bar">
                  <span
                    className={impactUp ? "up" : "down"}
                    style={{
                      width: `${Math.min(100, Math.max(8, Math.abs(Number(item.shapValue || 0)) * 7))}%`,
                    }}
                  />
                </div>
                <div className="feature-footer">
                  <small>observed value: {String(item.value)}</small>
                  <span className="feature-contribution">
                    {item.contributionPct.toFixed(1)}% share <ProvenanceTag kind="derived" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

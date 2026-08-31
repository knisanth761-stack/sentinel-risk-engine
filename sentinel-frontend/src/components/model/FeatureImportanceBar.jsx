import { humanizeFeature } from "../../lib/featureLabels";

export default function FeatureImportanceBar({ features }) {
  return (
    <div className="feature-importance-list">
      {features.map((item) => (
        <div className="feature-importance-row" key={item.feature}>
          <div className="feature-importance-top">
            <span title={item.feature}>{humanizeFeature(item.feature)}</span>
            <strong>{item.normalized.toFixed(1)}%</strong>
          </div>
          <div className="feature-importance-bar">
            <span style={{ width: `${item.normalized}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

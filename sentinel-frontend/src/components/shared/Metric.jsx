import ProvenanceTag from "./ProvenanceTag";

export default function Metric({ icon, label, value, suffix, description, provenance }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <div>
        <div className="metric-label-row">
          <span>{label}</span>
          {provenance && <ProvenanceTag kind={provenance} />}
        </div>
        <strong>
          {value}
          {suffix && <small>{suffix}</small>}
        </strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

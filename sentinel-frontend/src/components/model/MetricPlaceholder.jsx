import { CircleDashed } from "lucide-react";
import ProvenanceTag from "../shared/ProvenanceTag";

export default function MetricPlaceholder({ icon, label, endpoint, field, note }) {
  return (
    <div className="metric metric-pending">
      <div className="metric-icon">{icon}</div>
      <div>
        <div className="metric-label-row">
          <span>{label}</span>
          <ProvenanceTag kind="pending" />
        </div>
        <div className="metric-pending-status">
          <CircleDashed size={11} />
          PENDING TELEMETRY
        </div>
        <p>{note}</p>
        <code className="metric-pending-endpoint">
          {endpoint} → <em>{field}</em>
        </code>
      </div>
    </div>
  );
}

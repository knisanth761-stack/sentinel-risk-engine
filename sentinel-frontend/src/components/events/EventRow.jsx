import { AlertTriangle, ArrowDownRight, ArrowUpRight, ShieldAlert, ShieldCheck } from "lucide-react";
import RiskTierBadge from "../shared/RiskTierBadge";
import { riskTone } from "../../lib/risk";
import { formatINR, formatTime } from "../../lib/format";

const TONE_ICON = {
  safe: ShieldCheck,
  warning: ShieldAlert,
  danger: AlertTriangle,
};

export default function EventRow({ entry }) {
  const tone = riskTone(entry.decision);
  const majorSignal = entry.reasons[0] || entry.topFeatures[0]?.feature || "No dominant signal reported";
  const ToneIcon = TONE_ICON[tone] || TONE_ICON.safe;

  return (
    <div className={`event-row tier-line-${tone}`}>
      <div className="event-time">
        <span>{formatTime(entry.timestamp)}</span>
        <small>{entry.transaction.transactionId}</small>
      </div>

      <div className={`event-icon event-icon-${tone}`}>
        <ToneIcon size={15} />
      </div>

      <div className="event-body">
        <div className="event-body-top">
          <strong>{entry.transaction.userId}</strong>
          <span className="event-amount">
            {formatINR(entry.transaction.amount)}
            {tone === "danger" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </span>
        </div>
        <div className="event-body-meta">
          <span>{entry.transaction.type}</span>
          <span>·</span>
          <span>{majorSignal}</span>
        </div>
      </div>

      <div className="event-tags">
        <RiskTierBadge score={entry.score} />
        <span className={`decision-pill tier-${tone}`}>{entry.decision.toUpperCase()}</span>
      </div>
    </div>
  );
}

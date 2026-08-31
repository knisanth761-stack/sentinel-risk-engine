import { AlertOctagon, Eye, Radar, ShieldOff } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import EventTimeline from "../components/events/EventTimeline";
import ProvenanceTag from "../components/shared/ProvenanceTag";
import Metric from "../components/shared/Metric";
import { useSessionHistory } from "../context/SessionHistoryContext";
import { riskTone } from "../lib/risk";

const TIER_PRIORITY = ["CRITICAL", "HIGH", "MODERATE", "LOW"];

export default function RiskEvents() {
  const { history, summary } = useSessionHistory();

  // Highest non-zero tier bucket from the already-computed distribution —
  // a simple lookup over existing real counts, not a new classification.
  const highestTier = TIER_PRIORITY.find((tier) => summary.distribution[tier] > 0) || "—";

  // Uses the same exported riskTone() helper EventRow already relies on —
  // no new classification logic, just a count of an already-derivable tone.
  const reviewCount = history.filter((entry) => riskTone(entry.decision) === "warning").length;

  return (
    <>
      <Topbar
        eyebrow="RISK EVENTS"
        title="Session Event Timeline"
        subtitle="Every transaction analyzed by the live Sentinel engine this session, in chronological order."
      />

      <div className="investigation-context">
        <Radar size={13} />
        Session-derived investigation feed · in-browser only, not a persisted audit log
      </div>

      <section className="metrics-grid metrics-grid-4">
        <Metric
          icon={<Eye size={18} />}
          label="EVENTS THIS SESSION"
          value={summary.total}
          description="Transactions analyzed by the live engine"
          provenance="live"
        />
        <Metric
          icon={<AlertOctagon size={18} />}
          label="HIGHEST RISK TIER"
          value={highestTier}
          description="Peak severity observed this session"
          provenance="derived"
        />
        <Metric
          icon={<ShieldOff size={18} />}
          label="BLOCKED EVENTS"
          value={summary.blockedCount}
          description="Flagged BLOCK by the risk fusion layer"
          provenance="derived"
        />
        <Metric
          icon={<Radar size={18} />}
          label="UNDER REVIEW"
          value={reviewCount}
          description="Flagged REVIEW by the risk fusion layer"
          provenance="derived"
        />
      </section>

      <div className="command-section-label">
        <span>INVESTIGATION TIMELINE</span>
      </div>

      <section className="panel events-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">CHRONOLOGICAL</span>
            <h2>Analyzed Transactions</h2>
          </div>
          <ProvenanceTag kind="live" />
        </div>

        <p className="events-note">
          This is real, in-session analysis history — not a persisted audit log. A durable, cross-session event
          store requires a backend history endpoint (see Model Intelligence for details on what's needed next).
        </p>

        <div className="timeline-frame">
          <EventTimeline history={history} />
        </div>
      </section>
    </>
  );
}

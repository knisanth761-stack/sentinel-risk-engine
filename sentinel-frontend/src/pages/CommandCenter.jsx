import { useEffect, useRef, useState } from "react";
import { Activity, AlertOctagon, BarChart3, ShieldOff, TrendingUp, Wallet } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import Metric from "../components/shared/Metric";
import ProvenanceTag from "../components/shared/ProvenanceTag";
import EmptyState from "../components/shared/EmptyState";
import RiskTrendChart from "../components/charts/RiskTrendChart";
import RiskDistributionChart from "../components/charts/RiskDistributionChart";
import RiskTierBadge from "../components/shared/RiskTierBadge";
import { useSessionHistory } from "../context/SessionHistoryContext";
import { formatCompactINR, formatPercent, formatTime } from "../lib/format";
import { riskTone } from "../lib/risk";
import { getModelTelemetry } from "../api/model";
import { humanizeFeature } from "../lib/featureLabels";

const POLL_INTERVAL_MS = 5000;

export default function CommandCenter() {
  const { history, summary } = useSessionHistory();

  const [runtime, setRuntime] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState("loading"); // "loading" | "ready" | "error"
  const fetchInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      if (fetchInFlight.current) return; // never overlap requests
      fetchInFlight.current = true;

      getModelTelemetry()
        .then((data) => {
          if (cancelled) return;
          if (data?.runtimeTelemetry) {
            setRuntime(data.runtimeTelemetry);
            setRuntimeStatus("ready");
          } else {
            // Endpoint reachable but no runtime section yet — keep any
            // previously loaded value, don't downgrade to "error".
            setRuntimeStatus((prev) => (prev === "ready" ? "ready" : "error"));
          }
        })
        .catch(() => {
          if (cancelled) return;
          // Keep the last successfully fetched runtime data on screen;
          // only flag status so the fallback/notice can show if we
          // never had a successful fetch.
          setRuntimeStatus((prev) => (prev === "ready" ? "ready" : "error"));
        })
        .finally(() => {
          fetchInFlight.current = false;
        });
    };

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const transactionsScreened = summary.total;
  const blockedCount = summary.blockedCount;
  const blockRate = summary.blockRate;

  return (
    <div className="command-center">
      <Topbar
        eyebrow="SENTINEL COMMAND CENTER"
        title="Risk Overview"
        subtitle="Real-time summary of transactions screened by the Sentinel engine during this session."
      />

      {runtimeStatus !== "ready" && (
        <p className="telemetry-status">
          {runtimeStatus === "loading"
            ? "Loading live backend counters…"
            : "Live backend counters unavailable — showing session data."}
        </p>
      )}

      <div className="command-section-label">
        <span>OVERVIEW</span>
      </div>

      <section className="metrics-grid metrics-grid-5">
        <div className="metric-card metric-card-primary">
          <Metric
            icon={<Activity size={18} />}
            label="TRANSACTIONS SCREENED"
            value={transactionsScreened}
            description="Analyzed by the live risk engine"
            provenance="live"
          />
        </div>
        <div className="metric-card">
          <Metric
            icon={<Wallet size={18} />}
            label="VALUE SCREENED"
            value={formatCompactINR(summary.valueScreened)}
            description="Total amount across screened transactions"
            provenance="derived"
          />
        </div>
        <div className="metric-card">
          <Metric
            icon={<ShieldOff size={18} />}
            label="BLOCKED TRANSACTIONS"
            value={blockedCount}
            description="Flagged BLOCK by the risk fusion layer"
            provenance="derived"
          />
        </div>
        <div className="metric-card">
          <Metric
            icon={<AlertOctagon size={18} />}
            label="BLOCK RATE"
            value={formatPercent(blockRate)}
            description="Share of session traffic blocked"
            provenance="derived"
          />
        </div>
        <div className="metric-card">
          <Metric
            icon={<TrendingUp size={18} />}
            label="AMOUNT PROTECTED"
            value={formatCompactINR(summary.valueBlocked)}
            description="Value of blocked transactions this session"
            provenance="derived"
          />
        </div>
      </section>

      <div className="command-section-label">
        <span>RISK TREND &amp; DISTRIBUTION</span>
      </div>

      <section className="lower-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">RISK OVER TIME</span>
              <h2>Session Risk Trend</h2>
            </div>
            <ProvenanceTag kind="live" />
          </div>
          <RiskTrendChart history={history} />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">RISK DISTRIBUTION</span>
              <h2>Session Risk Tiers</h2>
            </div>
            <ProvenanceTag kind="derived" />
          </div>
          <RiskDistributionChart distribution={summary.distribution} total={summary.total} />
        </div>
      </section>

      <div className="command-section-label">
        <span>SIGNALS &amp; ACTIVITY</span>
      </div>

      <section className="lower-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">SIGNALS</span>
              <h2>Top Risk Signals</h2>
            </div>
            <ProvenanceTag kind="derived" />
          </div>

          {summary.topSignals.length ? (
            <div className="signal-list">
              {summary.topSignals.map(({ signal, count }) => (
                <div className="signal-list-row" key={signal}>
                  <span>{humanizeFeature(signal)}</span>
                  <strong>{count}×</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 size={30} />}
              title="No signals yet"
              message="Frequently recurring risk signals appear here as you analyze transactions."
            />
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">LIVE ACTIVITY</span>
              <h2>Recent Analyzed Transactions</h2>
            </div>
            <ProvenanceTag kind="live" />
          </div>

          {history.length ? (
            <div className="recent-list">
              {history.slice(0, 6).map((entry) => (
                <div className="recent-row" key={`${entry.id}-${entry.timestamp.getTime()}`}>
                  <div>
                    <strong>{entry.transaction.transactionId}</strong>
                    <span>{formatTime(entry.timestamp)}</span>
                  </div>
                  <RiskTierBadge score={entry.score} />
                  <span className={`decision-pill tier-${riskTone(entry.decision)}`}>
                    {entry.decision.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Activity size={30} />}
              title="No activity yet"
              message="Run a transaction in Transaction Intelligence to populate the command center."
            />
          )}
        </div>
      </section>
    </div>
  );
}

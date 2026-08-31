import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  BarChart3,
  Crosshair,
  GitBranch,
  Info,
  Layers,
  Network,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Target,
  TrendingUp,
  Waypoints,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import MetricPlaceholder from "../components/model/MetricPlaceholder";
import ExplainabilityFlow from "../components/model/ExplainabilityFlow";
import FeatureImportanceBar from "../components/model/FeatureImportanceBar";
import Metric from "../components/shared/Metric";
import EmptyState from "../components/shared/EmptyState";
import ProvenanceTag from "../components/shared/ProvenanceTag";
import { getModelTelemetry } from "../api/model";
import { formatINR, formatCompactINR } from "../lib/format";

// Metadata for the six HELD-OUT TEST EVALUATION metrics — icon/label/note
// stay fixed; the actual values only ever come from a successful
// telemetry fetch (real.metricKey below). Decimal precision matches
// exactly how ml/evaluate_saved_model.py itself prints them
// (.4f for the ratio metrics, .6f for FPR) — no re-rounding.
const METRIC_META = [
  { icon: <Target size={18} />, label: "PRECISION", metricKey: "precision", digits: 4 },
  { icon: <Crosshair size={18} />, label: "RECALL", metricKey: "recall", digits: 4 },
  { icon: <Layers size={18} />, label: "F1 SCORE", metricKey: "f1", digits: 4 },
  { icon: <TrendingUp size={18} />, label: "PR-AUC", metricKey: "prAuc", digits: 4 },
  { icon: <Activity size={18} />, label: "ROC-AUC", metricKey: "rocAuc", digits: 4 },
  { icon: <Waypoints size={18} />, label: "FALSE POSITIVE RATE", metricKey: "falsePositiveRate", digits: 6 },
];

// Fallback placeholder config — rendered only while telemetry is loading
// or if the fetch fails, so the section never looks broken or blank.
const METRICS_PENDING_FALLBACK = [
  { icon: <Target size={18} />, label: "PRECISION", endpoint: "GET /api/model/telemetry", field: "heldOutTestEvaluation.metrics.precision", note: "Fraction of BLOCK decisions that were true positives." },
  { icon: <Crosshair size={18} />, label: "RECALL", endpoint: "GET /api/model/telemetry", field: "heldOutTestEvaluation.metrics.recall", note: "Fraction of actual fraud caught by the model." },
  { icon: <Layers size={18} />, label: "F1 SCORE", endpoint: "GET /api/model/telemetry", field: "heldOutTestEvaluation.metrics.f1", note: "Harmonic mean of precision and recall." },
  { icon: <TrendingUp size={18} />, label: "PR-AUC", endpoint: "GET /api/model/telemetry", field: "heldOutTestEvaluation.metrics.prAuc", note: "Area under the precision-recall curve." },
  { icon: <Activity size={18} />, label: "ROC-AUC", endpoint: "GET /api/model/telemetry", field: "heldOutTestEvaluation.metrics.rocAuc", note: "Area under the ROC curve." },
  { icon: <Waypoints size={18} />, label: "FALSE POSITIVE RATE", endpoint: "GET /api/model/telemetry", field: "heldOutTestEvaluation.metrics.falsePositiveRate", note: "Share of legitimate transactions incorrectly flagged." },
];

// Static architecture facts — real, and already asserted elsewhere in the
// running app (App.jsx footer, TransactionIntelligence's ML Confidence
// label). These describe what the system IS, not something read off the
// artifact or an evaluation run, so they keep the neutral "ARCHITECTURE"
// tag rather than the telemetry-specific provenance labels below.
const STATIC_IDENTITY = [
  {
    icon: <GitBranch size={18} />,
    label: "DECISION LAYER",
    value: "Rules + ML Fusion",
    note: "Deterministic rules combined with model probability",
  },
  {
    icon: <Sparkles size={18} />,
    label: "EXPLAINABILITY",
    value: "SHAP",
    note: "Per-transaction feature attribution",
  },
];

export default function ModelIntelligence() {
  const [telemetry, setTelemetry] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  useEffect(() => {
    let cancelled = false;

    getModelTelemetry()
      .then((data) => {
        if (cancelled) return;
        setTelemetry(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const artifact = telemetry?.liveArtifactMetadata;
  const evaluation = telemetry?.heldOutTestEvaluation;
  const importance = telemetry?.globalFeatureImportance;
  const impact = telemetry?.businessImpact;

  const artifactFacts = [
    { icon: <Network size={18} />, label: "MODEL TYPE", value: artifact?.modelType ?? "—", note: "Read from the deployed artifact" },
    { icon: <Layers size={18} />, label: "TREES", value: artifact ? String(artifact.trees) : "—", note: "Boosted rounds in the artifact" },
    { icon: <Target size={18} />, label: "FEATURES", value: artifact ? String(artifact.features) : "—", note: "Input features the model expects" },
  ];

  return (
    <>
      <Topbar
        eyebrow="MODEL INTELLIGENCE"
        title="Model Performance & Governance"
        subtitle="Live artifact metadata, verified held-out evaluation, and drift monitoring."
      />

      {status !== "ready" && (
        <p className="telemetry-status">
          {status === "loading" ? "Loading verified model telemetry…" : "Model telemetry unavailable — showing architecture overview only."}
        </p>
      )}

      <div className="command-section-label">
        <span>MODEL OVERVIEW</span>
      </div>

      <section className="model-identity-grid">
        {artifactFacts.map((item) => (
          <div className="identity-fact" key={item.label}>
            <div className="metric-icon">{item.icon}</div>
            <div>
              <div className="metric-label-row">
                <span>{item.label}</span>
                <span className="architecture-fact-tag">LIVE ARTIFACT METADATA</span>
              </div>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </div>
          </div>
        ))}
        {STATIC_IDENTITY.map((item) => (
          <div className="identity-fact" key={item.label}>
            <div className="metric-icon">{item.icon}</div>
            <div>
              <div className="metric-label-row">
                <span>{item.label}</span>
                <span className="architecture-fact-tag">ARCHITECTURE</span>
              </div>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="command-section-label">
        <span>VALIDATED PERFORMANCE</span>
      </div>

      {status === "ready" && evaluation ? (
        <>
          <p className="model-section-note">
            <span className="architecture-fact-tag">HELD-OUT TEST EVALUATION</span>{" "}
            Evaluated on {evaluation.dataset.samples.toLocaleString()} held-out transactions
            ({evaluation.dataset.fraudCases.toLocaleString()} fraud cases) · threshold {evaluation.threshold.toFixed(2)}.
            Verified offline via {evaluation.script} against the deployed artifact — not calculated live per request.
          </p>

          <section className="metrics-grid metrics-grid-3">
            {METRIC_META.map((meta) => (
              <Metric
                key={meta.label}
                icon={meta.icon}
                label={meta.label}
                value={evaluation.metrics[meta.metricKey].toFixed(meta.digits)}
                description="Held-out test evaluation"
              />
            ))}
          </section>
        </>
      ) : (
        <>
          <p className="model-section-note">
            No offline evaluation results are currently loaded. The six metrics below are honestly unavailable —
            not hidden, not estimated.
          </p>
          <section className="metrics-grid metrics-grid-3">
            {METRICS_PENDING_FALLBACK.map((metric) => (
              <MetricPlaceholder key={metric.label} {...metric} />
            ))}
          </section>
        </>
      )}

      <div className="command-section-label">
        <span>BUSINESS IMPACT</span>
      </div>

      {status === "ready" && impact ? (
        <>
          <p className="model-section-note">
            <span className="architecture-fact-tag">HELD-OUT BUSINESS IMPACT EVALUATION</span>{" "}
            Measured on an untouched held-out test set using the exact deployed model artifact at threshold{" "}
            {impact.threshold.toFixed(2)}. These figures represent benchmark evaluation exposure — not
            guaranteed production savings. Verified offline via {impact.script}, not calculated live per
            request.
          </p>

          <div className="metric-card-primary impact-hero">
            <Metric
              icon={<ShieldCheck size={20} />}
              label="FRAUD AMOUNT PREVENTION RATE"
              value={`${(impact.businessRates.fraudAmountPreventionRate * 100).toFixed(4)}%`}
              description="Fraud exposure identified on the held-out evaluation dataset"
            />
          </div>

          <section className="metrics-grid metrics-grid-3">
            <Metric
              icon={<Banknote size={18} />}
              label="FRAUD EXPOSURE DETECTED"
              value={formatCompactINR(impact.fraudAmountImpact.fraudAmountDetected)}
              description={`Of ${formatCompactINR(
                impact.fraudAmountImpact.totalFraudExposure
              )} total evaluated fraud exposure`}
            />
            <Metric
              icon={<AlertTriangle size={18} />}
              label="FRAUD EXPOSURE MISSED"
              value={formatINR(impact.fraudAmountImpact.fraudAmountMissed)}
              description={`${(impact.businessRates.fraudAmountLeakageRate * 100).toFixed(
                4
              )}% of evaluated fraud exposure missed`}
            />
            <Metric
              icon={<ShieldOff size={18} />}
              label="FALSE POSITIVES"
              value={impact.transactionOutcomes.falsePositives}
              description="Legitimate transactions incorrectly flagged, held-out set"
            />
          </section>

          <div className="panel impact-outcomes-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">DETECTION OUTCOMES</span>
                <h2>Fraud Detected vs Missed</h2>
              </div>
              <span className="architecture-fact-tag">HELD-OUT BUSINESS IMPACT EVALUATION</span>
            </div>

            <div className="impact-outcome-bar">
              <span
                className="detected"
                style={{
                  width: `${
                    (impact.transactionOutcomes.fraudDetected / impact.transactionOutcomes.actualFraud) * 100
                  }%`,
                }}
              />
              <span
                className="missed"
                style={{
                  width: `${
                    (impact.transactionOutcomes.fraudMissed / impact.transactionOutcomes.actualFraud) * 100
                  }%`,
                }}
              />
            </div>

            <div className="impact-outcome-legend">
              <span className="impact-legend-item detected">
                <i /> {impact.transactionOutcomes.fraudDetected.toLocaleString()} detected
              </span>
              <span className="impact-legend-item missed">
                <i /> {impact.transactionOutcomes.fraudMissed.toLocaleString()} missed
              </span>
              <span className="impact-legend-total">
                of {impact.transactionOutcomes.actualFraud.toLocaleString()} actual fraud cases
              </span>
            </div>
          </div>

          <div className="impact-observation">
            <Info size={15} />
            <p>{impact.falsePositiveCost.interpretation}</p>
          </div>
        </>
      ) : (
        <p className="model-section-note">
          No business impact evaluation is currently loaded. This section is honestly unavailable — not
          hidden, not estimated.
        </p>
      )}

      <div className="command-section-label">
        <span>EXPLAINABILITY</span>
      </div>

      <section className="panel explainability-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">PIPELINE</span>
            <h2>How a Decision Gets Explained</h2>
          </div>
          <span className="architecture-fact-tag">ARCHITECTURE</span>
        </div>
        <p className="model-section-note explainability-note">
          A static description of the real pipeline already powering Transaction Intelligence — not a live feed.
          Per-transaction SHAP values and reasons are visible on the Transaction Intelligence page after analysis.
        </p>
        <ExplainabilityFlow />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">RELATIVE GLOBAL IMPORTANCE</span>
            <h2>Feature Importance (Model-Wide)</h2>
          </div>
          {status === "ready" && importance ? (
            <span className="architecture-fact-tag">GLOBAL FEATURE IMPORTANCE</span>
          ) : (
            <ProvenanceTag kind="pending" />
          )}
        </div>

        {status === "ready" && importance ? (
          <>
            <p className="model-section-note explainability-note">
              Model-level gain importance — not transaction-level SHAP. Verified offline from the deployed
              artifact; normalized against the top feature's gain for display only.
            </p>
            <FeatureImportanceBar features={importance.features.slice(0, 6)} />
          </>
        ) : (
          <EmptyState
            icon={<BarChart3 size={30} />}
            title="Only per-transaction SHAP exists today"
            message="Sentinel currently returns SHAP values scoped to a single analyzed transaction. Model-wide gain importance loads from the telemetry endpoint."
            spec="GET /api/model/telemetry → { globalFeatureImportance: { features: [{ feature, gain, normalized }] } }"
          />
        )}
      </section>

      <div className="command-section-label">
        <span>MONITORING &amp; TELEMETRY</span>
      </div>

      <section className="lower-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">MODEL REGISTRY</span>
              <h2>Model Version &amp; Training Info</h2>
            </div>
            <ProvenanceTag kind="pending" />
          </div>
          <EmptyState
            icon={<GitBranch size={30} />}
            title="Model version not exposed yet"
            message="The frontend has no way to know the deployed XGBoost model's version, training date, or dataset lineage."
            spec="GET /api/model/info → { modelVersion, trainedAt, datasetVersion, featureSetVersion }"
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">DRIFT</span>
              <h2>Model &amp; Data Drift</h2>
            </div>
            <ProvenanceTag kind="pending" />
          </div>
          <EmptyState
            icon={<Activity size={30} />}
            title="No drift monitoring endpoint"
            message="Score distributions and feature drift over time require a dedicated monitoring endpoint that doesn't exist yet."
            spec="GET /api/model/drift → { windowStart, windowEnd, scoreDistributionShift, featureDrift[] }"
          />
        </div>
      </section>

      <p className="model-footnote">
        Model Overview, Validated Performance, and Business Impact now render real telemetry from the backend.
        Nothing on this page is a fabricated number — Model Registry and Drift remain explicitly marked{" "}
        <ProvenanceTag kind="pending" /> until those endpoints exist.
      </p>
    </>
  );
}

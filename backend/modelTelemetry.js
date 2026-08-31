const fs = require("fs");
const path = require("path");

/*
 * ============================================================
 * MODEL TELEMETRY
 * ============================================================
 *
 * Provides:
 *
 * 1. LIVE ARTIFACT METADATA
 *    Read directly from the deployed XGBoost artifact.
 *
 * 2. HELD-OUT TEST EVALUATION
 *    Verified offline against the deployed artifact and an
 *    untouched held-out test set.
 *
 * 3. GLOBAL FEATURE IMPORTANCE
 *    Verified gain importance extracted from the deployed model.
 *
 * 4. BUSINESS IMPACT
 *    Verified offline against the deployed artifact and the
 *    untouched held-out evaluation dataset.
 *
 * 5. LIVE SERVICE TELEMETRY
 *    Runtime telemetry derived from the currently running
 *    backend process. These values are explicitly separated
 *    from offline model evaluation metrics.
 */

const MODEL_PATH = path.join(
  __dirname,
  "..",
  "ml",
  "xgboost_fraud_model.json"
);

let cachedArtifactMetadata = null;

/*
 * ============================================================
 * LIVE ARTIFACT METADATA
 * ============================================================
 */

function loadArtifactMetadata() {
  if (cachedArtifactMetadata) {
    return cachedArtifactMetadata;
  }

  const raw = fs.readFileSync(MODEL_PATH, "utf8");
  const artifact = JSON.parse(raw);

  const learner = artifact.learner;
  const featureNames = learner.feature_names;
  const gbtreeParam =
    learner.gradient_booster.model.gbtree_model_param;

  cachedArtifactMetadata = {
    provenance: "LIVE ARTIFACT METADATA",
    description:
      "Derived directly from the currently deployed model artifact on disk. Reflects whatever is actually running.",
    modelPath: "ml/xgboost_fraud_model.json",
    modelType: "XGBoost",
    trees: Number(gbtreeParam.num_trees),
    features: featureNames.length,
    featureNames
  };

  return cachedArtifactMetadata;
}

/*
 * ============================================================
 * HELD-OUT TEST EVALUATION
 * ============================================================
 */

const HELD_OUT_TEST_EVALUATION = {
  provenance: "HELD-OUT TEST EVALUATION",

  description:
    "Verified offline using ml/evaluate_saved_model.py against the deployed artifact and an untouched held-out test set. Not calculated live per API request.",

  script: "ml/evaluate_saved_model.py",

  modelPath:
    "ml/xgboost_fraud_model.json",

  threshold: 0.5,

  dataset: {
    samples: 123580,
    fraudCases: 1654,
    fraudRate: 0.01338404
  },

  metrics: {
    prAuc: 1.0,
    rocAuc: 1.0,
    precision: 1.0,
    recall: 0.9994,
    f1: 0.9997,
    falsePositiveRate: 0.0
  },

  confusionMatrix: {
    trueNegative: 121926,
    falsePositive: 0,
    falseNegative: 1,
    truePositive: 1653
  },

  artifactVerification: {
    savedArtifactLoadedDirectly: true,
    testSetUsedForTraining: false,
    testLabelsUsedDuringFit: false,
    featureOrderVerified: true
  }
};

/*
 * ============================================================
 * GLOBAL FEATURE IMPORTANCE
 * ============================================================
 */

const RAW_FEATURE_GAIN = [
  { feature: "newbalanceOrig", gain: 58126.53125 },
  { feature: "balance_change_orig", gain: 54744.109375 },
  { feature: "orig_balance_error", gain: 31216.621094 },
  { feature: "type_TRANSFER", gain: 8373.043945 },
  { feature: "amount_to_oldbalance_orig", gain: 7709.836426 },
  { feature: "type_CASH_OUT", gain: 2898.037354 },
  { feature: "amount", gain: 2871.89624 },
  { feature: "oldbalanceOrg", gain: 1891.403687 },
  { feature: "dest_balance_error", gain: 1046.428223 },
  { feature: "balance_change_dest", gain: 929.664612 },
  { feature: "newbalanceDest", gain: 861.97406 },
  { feature: "type_PAYMENT", gain: 801.798462 },
  { feature: "amount_to_oldbalance_dest", gain: 744.416443 },
  { feature: "type_CASH_IN", gain: 436.577026 },
  { feature: "oldbalanceDest", gain: 353.102264 },
  { feature: "step", gain: 202.162964 },
  { feature: "type_DEBIT", gain: 61.537354 }
];

function buildGlobalFeatureImportance() {
  const maxGain = Math.max(
    ...RAW_FEATURE_GAIN.map((feature) => feature.gain)
  );

  const features = RAW_FEATURE_GAIN.map((feature) => ({
    feature: feature.feature,
    gain: feature.gain,
    normalized: Number(
      ((feature.gain / maxGain) * 100).toFixed(2)
    )
  }));

  return {
    provenance: "GLOBAL FEATURE IMPORTANCE",

    description:
      "Verified gain importance extracted offline from the deployed artifact. Not recomputed in JavaScript.",

    importanceType: "gain",

    modelPath:
      "ml/xgboost_fraud_model.json",

    features
  };
}

/*
 * ============================================================
 * HELD-OUT BUSINESS IMPACT EVALUATION
 * ============================================================
 */

const BUSINESS_IMPACT = {
  provenance:
    "HELD-OUT BUSINESS IMPACT EVALUATION",

  description:
    "Verified offline using ml/business_impact.py against the deployed artifact and an untouched held-out test set. Amounts represent evaluated dataset fraud exposure, not guaranteed production savings.",

  script:
    "ml/business_impact.py",

  modelPath:
    "ml/xgboost_fraud_model.json",

  threshold: 0.5,

  transactionOutcomes: {
    totalTransactions: 123580,
    actualFraud: 1654,
    fraudDetected: 1653,
    fraudMissed: 1,
    falsePositives: 0,
    legitimateTransactions: 121926
  },

  fraudAmountImpact: {
    totalFraudExposure: 2722434569.36,
    fraudAmountDetected: 2722035524.28,
    fraudAmountMissed: 399045.08,
    legitimateAmountFlagged: 0
  },

  businessRates: {
    fraudAmountPreventionRate: 0.999853,
    fraudAmountLeakageRate: 0.000147,
    legitimateFalsePositiveRate: 0
  },

  falsePositiveCost: {
    observedFalsePositiveCount: 0,

    observedLegitimateAmountFlagged: 0,

    observedDirectInterventionCost: 0,

    interpretation:
      "No legitimate transactions were incorrectly flagged on this held-out evaluation set. This is an observed test-set result, not a guarantee of zero false positives in production."
  },

  artifactVerification: {
    savedArtifactLoadedDirectly: true,
    modelRetrained: false,
    heldOutTestSet: true,
    featureOrderFromArtifact: true,
    productionModelEvaluated: true
  }
};

/*
 * ============================================================
 * LIVE RUNTIME TELEMETRY
 * ============================================================
 *
 * These counters describe the current backend process only.
 * They reset when the backend restarts.
 *
 * This is intentionally separate from held-out model metrics.
 */

const runtimeState = {
  startedAt: new Date().toISOString(),

  requests: {
    total: 0,
    successful: 0,
    failed: 0
  },

  transactions: {
    processed: 0,
    safe: 0,
    review: 0,
    suspicious: 0,
    block: 0
  },

  latency: {
    totalMs: 0,
    samples: 0,
    lastMs: null
  },

  services: {
    mlServiceAvailable: null,
    databaseAvailable: null
  }
};

/*
 * Called by the transaction pipeline after processing.
 */

function recordTransactionTelemetry({
  decision,
  latencyMs,
  success = true
}) {
  runtimeState.requests.total += 1;

  if (success) {
    runtimeState.requests.successful += 1;
  } else {
    runtimeState.requests.failed += 1;
  }

  if (success) {
    runtimeState.transactions.processed += 1;

    const normalizedDecision =
      String(decision || "").toUpperCase();

    if (normalizedDecision === "SAFE") {
      runtimeState.transactions.safe += 1;
    }

    if (normalizedDecision === "REVIEW") {
      runtimeState.transactions.review += 1;
    }

    if (normalizedDecision === "SUSPICIOUS") {
      runtimeState.transactions.suspicious += 1;
    }

    if (normalizedDecision === "BLOCK") {
      runtimeState.transactions.block += 1;
    }
  }

  if (
    typeof latencyMs === "number" &&
    Number.isFinite(latencyMs)
  ) {
    runtimeState.latency.totalMs += latencyMs;
    runtimeState.latency.samples += 1;
    runtimeState.latency.lastMs = latencyMs;
  }
}

/*
 * Service availability is updated by the backend.
 */

function updateServiceTelemetry({
  mlServiceAvailable,
  databaseAvailable
} = {}) {
  if (typeof mlServiceAvailable === "boolean") {
    runtimeState.services.mlServiceAvailable =
      mlServiceAvailable;
  }

  if (typeof databaseAvailable === "boolean") {
    runtimeState.services.databaseAvailable =
      databaseAvailable;
  }
}

function getRuntimeTelemetry() {
  const uptimeSeconds =
    Math.floor(process.uptime());

  const averageLatencyMs =
    runtimeState.latency.samples > 0
      ? Number(
          (
            runtimeState.latency.totalMs /
            runtimeState.latency.samples
          ).toFixed(2)
        )
      : null;

  const successRate =
    runtimeState.requests.total > 0
      ? Number(
          (
            runtimeState.requests.successful /
            runtimeState.requests.total
          ).toFixed(6)
        )
      : null;

  return {
    provenance:
      "LIVE BACKEND RUNTIME TELEMETRY",

    description:
      "Derived from the currently running backend process. Counters reset when the service restarts and are not model evaluation metrics.",

    startedAt:
      runtimeState.startedAt,

    uptimeSeconds,

    process: {
      pid: process.pid,
      nodeVersion: process.version
    },

    requests: {
      ...runtimeState.requests,
      successRate
    },

    transactions:
      runtimeState.transactions,

    latency: {
      averageMs:
        averageLatencyMs,

      lastMs:
        runtimeState.latency.lastMs,

      samples:
        runtimeState.latency.samples
    },

    services:
      runtimeState.services
  };
}

/*
 * ============================================================
 * COMPLETE TELEMETRY RESPONSE
 * ============================================================
 */

function getModelTelemetry() {
  return {
    liveArtifactMetadata:
      loadArtifactMetadata(),

    heldOutTestEvaluation:
      HELD_OUT_TEST_EVALUATION,

    globalFeatureImportance:
      buildGlobalFeatureImportance(),

    businessImpact:
      BUSINESS_IMPACT,

    runtimeTelemetry:
      getRuntimeTelemetry()
  };
}

module.exports = {
  getModelTelemetry,
  recordTransactionTelemetry,
  updateServiceTelemetry
};

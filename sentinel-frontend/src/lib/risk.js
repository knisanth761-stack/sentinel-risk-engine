// Pure, side-effect-free helpers.
//
// Two categories live here, kept explicitly separate:
//   1. EXTRACTORS  — read fields straight out of the real engine response.
//      Nothing here invents a number; it only normalizes which key the
//      backend used (the original app already had to guess between a
//      few possible field names, so that fallback logic is centralized
//      here instead of duplicated across components).
//   2. DERIVED      — client-side math computed FROM those real values
//      (risk tiers, agreement, % contribution, balance deltas). These
//      are always tagged DERIVED in the UI and never presented as
//      something the engine itself returned.

// ---------------------------------------------------------------------
// EXTRACTORS (Category A — straight from the real engine response)
// ---------------------------------------------------------------------

export function extractFusion(result) {
  return result?.fusion || {};
}

export function extractRules(result) {
  return result?.rules || {};
}

export function extractMl(result) {
  return result?.ml || {};
}

export function extractExplanation(result) {
  return result?.explanation || {};
}

export function extractDecision(result) {
  const fusion = extractFusion(result);
  const rules = extractRules(result);
  return fusion.finalDecision || fusion.decision || rules.decision || "SAFE";
}

export function extractScore(result) {
  const fusion = extractFusion(result);
  const rules = extractRules(result);
  return Number(fusion.finalRiskScore ?? fusion.riskScore ?? rules.riskScore ?? 0);
}

export function extractRuleScore(result) {
  const rules = extractRules(result);
  return Number(rules.riskScore ?? 0);
}

export function extractMlProbability(result) {
  const ml = extractMl(result);
  return Number(ml.fraudProbability || 0);
}

export function extractTopFeatures(result) {
  const ml = extractMl(result);
  return ml.explanation?.top_features || [];
}

export function extractReasons(result) {
  const explanation = extractExplanation(result);
  const raw = explanation.reasons || explanation.riskFactors || explanation.messages || [];
  return raw.map((reason) =>
    typeof reason === "string" ? reason : reason.message || reason.description || JSON.stringify(reason)
  );
}

export function extractTriggeredRules(result) {
  // Backend does not currently emit a per-rule breakdown (see data gap
  // report, item C.6) — this returns [] until that field exists, rather
  // than fabricating rule names.
  const rules = extractRules(result);
  return rules.triggeredRules || rules.triggered || null;
}

// ---------------------------------------------------------------------
// DERIVED (Category B — computed client-side from real values above)
// ---------------------------------------------------------------------

export function riskTone(decision = "") {
  const value = decision.toUpperCase();
  if (value.includes("BLOCK")) return "danger";
  if (value.includes("SUSPICIOUS")) return "danger";
  if (value.includes("REVIEW")) return "warning";
  return "safe";
}

const TIERS = [
  { max: 24, label: "LOW", tone: "safe" },
  { max: 49, label: "MODERATE", tone: "warning" },
  { max: 74, label: "HIGH", tone: "danger" },
  { max: 100, label: "CRITICAL", tone: "danger" },
];

export function riskTier(score) {
  const value = Number(score) || 0;
  const tier = TIERS.find((t) => value <= t.max) || TIERS[TIERS.length - 1];
  return tier;
}

export function agreement(ruleScore, mlProbability) {
  const normalizedRule = Math.min(1, Math.max(0, Number(ruleScore) / 100));
  const normalizedMl = Math.min(1, Math.max(0, Number(mlProbability)));
  const diff = Math.abs(normalizedRule - normalizedMl);

  let level = "ALIGNED";
  if (diff > 0.35) level = "HIGH DIVERGENCE";
  else if (diff > 0.15) level = "MODERATE DIVERGENCE";

  return { diff, level, ruleSignal: normalizedRule, mlSignal: normalizedMl };
}

export function shapContributions(topFeatures = []) {
  const total = topFeatures.reduce((sum, f) => sum + Math.abs(Number(f.shapValue || 0)), 0);
  if (total === 0) return topFeatures.map((f) => ({ ...f, contributionPct: 0 }));
  return topFeatures.map((f) => ({
    ...f,
    contributionPct: (Math.abs(Number(f.shapValue || 0)) / total) * 100,
  }));
}

export function balanceConsistency(transaction) {
  const originDelta = Number(transaction.oldbalanceOrg) - Number(transaction.newbalanceOrig);
  const destDelta = Number(transaction.newbalanceDest) - Number(transaction.oldbalanceDest);
  const amount = Number(transaction.amount);

  const originConsistent = Math.abs(originDelta - amount) < 0.01;
  const destConsistent = Math.abs(destDelta - amount) < 0.01;

  return {
    originDelta,
    destDelta,
    amount,
    originConsistent,
    destConsistent,
    fullyConsistent: originConsistent && destConsistent,
  };
}

// ---------------------------------------------------------------------
// Session-history aggregates (Category B — real per-transaction results
// analyzed during this browser session, aggregated client-side)
// ---------------------------------------------------------------------

export function summarizeHistory(entries = []) {
  const total = entries.length;
  const valueScreened = entries.reduce((sum, e) => sum + Number(e.transaction.amount || 0), 0);

  const blocked = entries.filter((e) => riskTone(e.decision) === "danger");
  const blockedCount = blocked.length;
  const blockRate = total ? blockedCount / total : 0;
  const valueBlocked = blocked.reduce((sum, e) => sum + Number(e.transaction.amount || 0), 0);

  const distribution = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
  entries.forEach((e) => {
    distribution[riskTier(e.score).label] += 1;
  });

  const signalCounts = new Map();
  entries.forEach((e) => {
    e.reasons.forEach((reason) => {
      signalCounts.set(reason, (signalCounts.get(reason) || 0) + 1);
    });
    e.topFeatures.forEach((f) => {
      const key = `${f.feature}`;
      signalCounts.set(key, (signalCounts.get(key) || 0) + 1);
    });
  });

  const topSignals = [...signalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([signal, count]) => ({ signal, count }));

  return {
    total,
    valueScreened,
    blockedCount,
    blockRate,
    valueBlocked,
    distribution,
    topSignals,
  };
}

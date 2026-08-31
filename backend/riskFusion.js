function calculateFinalRisk(ruleRisk, fraudProbability) {
  // ------------------------------------------------------------
  // 1. Normalize inputs
  // ------------------------------------------------------------

  const safeRuleRisk = Math.max(
    0,
    Math.min(100, Number(ruleRisk) || 0)
  );

  const safeFraudProbability = Math.max(
    0,
    Math.min(1, Number(fraudProbability) || 0)
  );

  // ML probability -> 0–100 risk
  const mlRisk = safeFraudProbability * 100;

  // ------------------------------------------------------------
  // 2. Weighted hybrid fusion
  // ------------------------------------------------------------

  const weightedScore =
    (safeRuleRisk * 0.40) +
    (mlRisk * 0.60);

  let finalRiskScore = weightedScore;

  // ------------------------------------------------------------
  // 3. Guardrails
  //
  // Strong evidence from either layer cannot be cancelled
  // by a weak score from the other layer.
  // ------------------------------------------------------------

  // Strong rule evidence
  if (safeRuleRisk >= 70) {
    finalRiskScore = Math.max(finalRiskScore, 70);
  } else if (safeRuleRisk >= 40) {
    finalRiskScore = Math.max(finalRiskScore, 40);
  } else if (safeRuleRisk >= 25) {
    finalRiskScore = Math.max(finalRiskScore, 25);
  }

  // Strong ML evidence
  if (mlRisk >= 70) {
    finalRiskScore = Math.max(finalRiskScore, 70);
  } else if (mlRisk >= 40) {
    finalRiskScore = Math.max(finalRiskScore, 40);
  } else if (mlRisk >= 25) {
    finalRiskScore = Math.max(finalRiskScore, 25);
  }

  // ------------------------------------------------------------
  // 4. Clamp + round
  // ------------------------------------------------------------

  finalRiskScore = Math.max(
    0,
    Math.min(100, finalRiskScore)
  );

  const score = Number(
    finalRiskScore.toFixed(2)
  );

  // ------------------------------------------------------------
  // 5. Decision bands
  //
  // SAFE       : 0–24
  // REVIEW     : 25–39
  // SUSPICIOUS : 40–69
  // BLOCK      : 70–100
  // ------------------------------------------------------------

  let decision = "SAFE";

  if (score >= 70) {
    decision = "BLOCK";
  } else if (score >= 40) {
    decision = "SUSPICIOUS";
  } else if (score >= 25) {
    decision = "REVIEW";
  }

  // ------------------------------------------------------------
  // 6. Return complete fusion result
  // ------------------------------------------------------------

  return {
    ruleRisk: Number(safeRuleRisk.toFixed(2)),
    mlRisk: Number(mlRisk.toFixed(2)),
    finalRiskScore: score,
    decision
  };
}

module.exports = calculateFinalRisk;

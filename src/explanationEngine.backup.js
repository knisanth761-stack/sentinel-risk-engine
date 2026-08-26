function explainRisk(rules, ml, fusion) {
  const reasons = [];

  // Rule-based explanations
  if (rules.signals) {
    for (const signal of rules.signals) {
      reasons.push(signal.message);
    }
  }

  // ML-based explanations
  if (ml.explanation?.top_features) {
    for (const feature of ml.explanation.top_features) {
      if (feature.impact !== "INCREASES_FRAUD_RISK") {
        continue;
      }

      switch (feature.feature) {
        case "orig_balance_error":
          reasons.push(
            "Abnormal origin account balance pattern detected"
          );
          break;

        case "balance_change_orig":
          reasons.push(
            "Unusual movement of funds from the source account"
          );
          break;

        case "amount_to_oldbalance_orig":
          reasons.push(
            "Transaction amount is extremely large relative to the source balance"
          );
          break;

        case "newbalanceOrig":
          reasons.push(
            "Source account balance was significantly depleted"
          );
          break;

        case "amount":
          reasons.push(
            "Transaction amount is unusually large"
          );
          break;

        default:
          break;
      }
    }
  }

  // ML confidence
  if (ml.fraudProbability >= 0.99) {
    reasons.push(
      "ML model detected extremely high fraud probability"
    );
  } else if (ml.fraudProbability >= 0.75) {
    reasons.push(
      "ML model detected elevated fraud probability"
    );
  }

  // Remove duplicate explanations
  const uniqueReasons = [...new Set(reasons)];

  let summary = "Transaction appears low risk";

  if (fusion.decision === "REVIEW") {
    summary = "Transaction requires additional review";
  }

  if (fusion.decision === "BLOCK") {
    summary = "High-risk transaction detected";
  }

  return {
    summary,
    reasons: uniqueReasons.slice(0, 5)
  };
}

module.exports = explainRisk;

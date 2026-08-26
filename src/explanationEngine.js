function explainRisk(rules, ml, fusion) {
  const reasons = [];

  /*
   * ============================================================
   * 1. RULE ENGINE EXPLANATIONS
   * ============================================================
   */

  if (rules.signals) {
    for (const signal of rules.signals) {
      if (signal.message) {
        reasons.push(signal.message);
      }
    }
  }

  /*
   * ============================================================
   * 2. ML / SHAP EXPLANATIONS
   *
   * Only use fraud-driving SHAP features when the ML model
   * actually considers the transaction suspicious.
   *
   * This prevents low-risk transactions from receiving
   * misleading fraud explanations.
   * ============================================================
   */

  const fraudProbability = Number(ml.fraudProbability || 0);

  const shouldExplainML =
    fraudProbability >= 0.50 ||
    ml.isFraud === 1;

  if (
    shouldExplainML &&
    ml.explanation?.top_features
  ) {
    for (const feature of ml.explanation.top_features) {

      if (feature.impact !== "INCREASES_FRAUD_RISK") {
        continue;
      }

      switch (feature.feature) {

        case "orig_balance_error":
          reasons.push(
            "The transaction shows an unusual source-account balance pattern."
          );
          break;

        case "balance_change_orig":
          reasons.push(
            "A significant amount of money is moving out of the source account."
          );
          break;

        case "amount_to_oldbalance_orig":
          reasons.push(
            "The transaction amount is very large relative to the source account balance."
          );
          break;

        case "newbalanceOrig":
          reasons.push(
            "The transaction significantly reduces the source account balance."
          );
          break;

        case "amount":
          reasons.push(
            "The transaction amount is unusually large."
          );
          break;

        case "oldbalanceOrg":
          reasons.push(
            "The source account has an unusually large balance for this transaction pattern."
          );
          break;

        case "oldbalanceDest":
          reasons.push(
            "The destination account balance contributes to an unusual transaction pattern."
          );
          break;

        case "newbalanceDest":
          reasons.push(
            "The resulting destination balance is unusual for this transaction."
          );
          break;

        case "balance_change_dest":
          reasons.push(
            "The amount moved into the destination account is unusual."
          );
          break;

        case "amount_to_oldbalance_dest":
          reasons.push(
            "The transaction amount is unusually large relative to the destination balance."
          );
          break;

        case "step":
          reasons.push(
            "The transaction occurs at an unusual point in the transaction timeline."
          );
          break;

        default:
          break;
      }
    }
  }

  /*
   * ============================================================
   * 3. ML CONFIDENCE EXPLANATION
   * ============================================================
   */

  if (fraudProbability >= 0.99) {

    reasons.push(
      "The machine-learning model assigns an extremely high probability of fraud."
    );

  } else if (fraudProbability >= 0.75) {

    reasons.push(
      "The machine-learning model assigns a high probability of fraud."
    );

  } else if (fraudProbability >= 0.50) {

    reasons.push(
      "The machine-learning model identifies elevated fraud risk."
    );
  }

  /*
   * ============================================================
   * 4. FINAL DECISION SUMMARY
   * ============================================================
   */

  let summary = "Transaction appears low risk.";

  if (fusion.decision === "REVIEW") {
    summary =
      "Transaction requires additional review.";
  }

  if (fusion.decision === "BLOCK") {
    summary =
      "High-risk transaction detected.";
  }

  /*
   * ============================================================
   * 5. REMOVE DUPLICATES
   * ============================================================
   */

  const uniqueReasons = [...new Set(reasons)];

  /*
   * ============================================================
   * 6. FINAL RESPONSE
   * ============================================================
   */

  return {
    summary,
    reasons: uniqueReasons.slice(0, 5)
  };
}

module.exports = explainRisk;

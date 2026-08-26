function calculateRisk(transaction, recentTransactions = []) {
  let riskScore = 0;
  const signals = [];

  const amount = Number(transaction.amount) || 0;
  const oldBalanceOrg = Number(transaction.oldbalanceOrg) || 0;
  const newBalanceOrig = Number(transaction.newbalanceOrig) || 0;
  const oldBalanceDest = Number(transaction.oldbalanceDest) || 0;
  const newBalanceDest = Number(transaction.newbalanceDest) || 0;

  /*
   * ============================================================
   * 1. HIGH TRANSACTION AMOUNT
   * ============================================================
   */

  if (amount >= 50000) {
    riskScore += 30;

    signals.push({
      type: "HIGH_AMOUNT",
      severity: "HIGH",
      score: 30,
      message: "Transaction amount is unusually high"
    });
  }

  /*
   * ============================================================
   * 2. TRANSACTION VELOCITY
   * ============================================================
   *
   * More than 3 previous transactions in the recent window.
   */

  if (recentTransactions.length > 3) {
    riskScore += 25;

    signals.push({
      type: "HIGH_VELOCITY",
      severity: "MEDIUM",
      score: 25,
      message: "Multiple transactions detected within 10 minutes"
    });
  }

  /*
   * ============================================================
   * 3. BEHAVIORAL ANOMALY
   * ============================================================
   *
   * Current transaction is >= 5x the user's recent average.
   */

  if (recentTransactions.length > 1) {
    const totalAmount = recentTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    const averageAmount =
      totalAmount / recentTransactions.length;

    if (
      averageAmount > 0 &&
      amount >= averageAmount * 5
    ) {
      riskScore += 30;

      signals.push({
        type: "BEHAVIORAL_ANOMALY",
        severity: "HIGH",
        score: 30,
        message:
          "Transaction amount is unusually high compared with user's recent behavior"
      });
    }
  }

  /*
   * ============================================================
   * 4. SOURCE BALANCE DEPLETION
   * ============================================================
   *
   * Transaction consumes >= 90% of source balance.
   */

  if (
    oldBalanceOrg > 0 &&
    amount / oldBalanceOrg >= 0.9
  ) {
    riskScore += 30;

    signals.push({
      type: "SOURCE_BALANCE_DEPLETION",
      severity: "HIGH",
      score: 30,
      message:
        "Transaction consumes almost the entire source account balance"
    });
  }

  /*
   * ============================================================
   * 5. SOURCE BALANCE CONSISTENCY
   * ============================================================
   *
   * Expected:
   *
   * oldbalanceOrg - amount ≈ newbalanceOrig
   *
   * IMPORTANT:
   * This is treated as an integrity/anomaly signal rather
   * than strong fraud evidence.
   */

  if (
    oldBalanceOrg >= 0 &&
    newBalanceOrig >= 0
  ) {
    const expectedNewSourceBalance =
      oldBalanceOrg - amount;

    const sourceDifference =
      Math.abs(
        expectedNewSourceBalance -
        newBalanceOrig
      );

    const tolerance = Math.max(
      1,
      oldBalanceOrg * 0.01
    );

    if (sourceDifference > tolerance) {
      riskScore += 10;

      signals.push({
        type: "SOURCE_BALANCE_MISMATCH",
        severity: "LOW",
        score: 10,
        message:
          "Source account balance does not match the expected transaction balance"
      });
    }
  }

  /*
   * ============================================================
   * 6. DESTINATION BALANCE CONSISTENCY
   * ============================================================
   *
   * Expected:
   *
   * oldbalanceDest + amount ≈ newbalanceDest
   *
   * This is also treated as an integrity/anomaly signal.
   */

  if (
    oldBalanceDest >= 0 &&
    newBalanceDest >= 0
  ) {
    const expectedNewDestinationBalance =
      oldBalanceDest + amount;

    const destinationDifference =
      Math.abs(
        expectedNewDestinationBalance -
        newBalanceDest
      );

    const tolerance = Math.max(
      1,
      Math.max(
        oldBalanceDest,
        amount
      ) * 0.01
    );

    if (destinationDifference > tolerance) {
      riskScore += 8;

      signals.push({
        type: "DESTINATION_BALANCE_MISMATCH",
        severity: "LOW",
        score: 8,
        message:
          "Destination account balance does not match the expected transaction balance"
      });
    }
  }

  /*
   * ============================================================
   * 7. HIGH-RISK TRANSACTION TYPE
   * ============================================================
   *
   * Large CASH_OUT / TRANSFER transactions receive
   * additional scrutiny.
   */

  const transactionType =
    String(transaction.type || "").toUpperCase();

  if (
    (
      transactionType === "CASH_OUT" ||
      transactionType === "TRANSFER"
    ) &&
    amount >= 25000
  ) {
    riskScore += 15;

    signals.push({
      type: "HIGH_RISK_TRANSACTION_TYPE",
      severity: "MEDIUM",
      score: 15,
      message:
        `${transactionType} transaction with a large amount requires additional scrutiny`
    });
  }

  /*
   * ============================================================
   * 8. RAPID CUMULATIVE SPENDING
   * ============================================================
   *
   * Detect large cumulative movement during the
   * recent activity window.
   */

  if (recentTransactions.length >= 3) {
    const recentTotal = recentTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    const cumulativeAmount =
      recentTotal + amount;

    if (
      oldBalanceOrg > 0 &&
      cumulativeAmount >= oldBalanceOrg * 0.9
    ) {
      riskScore += 20;

      signals.push({
        type: "RAPID_CUMULATIVE_SPENDING",
        severity: "HIGH",
        score: 20,
        message:
          "Recent transaction activity represents a large portion of the source account balance"
      });
    }
  }

  /*
   * ============================================================
   * 9. FINAL SCORE
   * ============================================================
   */

  riskScore = Math.min(
    Math.round(riskScore),
    100
  );

  /*
   * ============================================================
   * 10. DECISION
   * ============================================================
   */

  let decision = "SAFE";

  if (riskScore >= 70) {
    decision = "BLOCK";
  } else if (riskScore >= 40) {
    decision = "SUSPICIOUS";
  }

  /*
   * ============================================================
   * 11. SORT SIGNALS
   * ============================================================
   */

  signals.sort((a, b) => {
    return (b.score || 0) - (a.score || 0);
  });

  /*
   * ============================================================
   * 12. RETURN
   * ============================================================
   */

  return {
    riskScore,
    decision,
    signals
  };
}

module.exports = calculateRisk;

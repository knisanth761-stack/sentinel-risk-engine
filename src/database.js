const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

/*
 * ============================================================
 * BEHAVIORAL HISTORY
 * ============================================================
 */

async function getRecentTransactions(userId) {
  const result = await pool.query(
    `SELECT *
     FROM transactions
     WHERE user_id = $1
     AND created_at >= NOW() - INTERVAL '10 minutes'
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/*
 * ============================================================
 * PERSISTED RISK OUTCOME
 * ============================================================
 */

async function updateTransactionOutcome(
  transactionId,
  {
    processingStatus,
    ruleRiskScore = null,
    mlProbability = null,
    finalRiskScore = null,
    decision = null,
    signals = null,
    explanation = null,
    failureReason = null
  }
) {
  const result = await pool.query(
    `UPDATE transactions
     SET
       processing_status = $2,
       rule_risk_score = $3,
       ml_probability = $4,
       final_risk_score = $5,
       decision = $6,
       signals = $7,
       explanation = $8,
       processed_at = NOW(),
       failure_reason = $9
     WHERE transaction_id = $1
     RETURNING *`,
    [
      transactionId,
      processingStatus,
      ruleRiskScore,
      mlProbability,
      finalRiskScore,
      decision,
      signals ? JSON.stringify(signals) : null,
      explanation ? JSON.stringify(explanation) : null,
      failureReason
    ]
  );

  return result.rows[0];
}

/*
 * ============================================================
 * PERSISTED TRANSACTION HISTORY
 * ============================================================
 */

async function getTransactionHistory(limit = 100) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 100, 1),
    500
  );

  const result = await pool.query(
    `SELECT
       transaction_id,
       user_id,
       amount,
       currency,
       created_at,
       processing_status,
       rule_risk_score,
       ml_probability,
       final_risk_score,
       decision,
       signals,
       explanation,
       processed_at,
       failure_reason
     FROM transactions
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows;
}

module.exports = {
  pool,
  getRecentTransactions,
  updateTransactionOutcome,
  getTransactionHistory
};

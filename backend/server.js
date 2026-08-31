require("dotenv").config();
const express = require("express");

const {
  pool,
  getRecentTransactions,
  updateTransactionOutcome,
  getTransactionHistory
} = require("./database");
const calculateRisk = require("./riskEngine");
const calculateFinalRisk = require("./riskFusion");
const explainRisk = require("./explanationEngine");
const validateTransaction = require("./validateTransaction");
const {
  getModelTelemetry,
  recordTransactionTelemetry,
  updateServiceTelemetry
} = require("./modelTelemetry");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL ||
  "http://localhost:8000";

const app = express();

app.use(express.json());

/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "Sentinel Risk Engine"
  });
});

/*
 * ============================================================
 * MODEL TELEMETRY
 * ============================================================
 *
 * Read-only. Combines live artifact metadata (derived from the
 * deployed ml/xgboost_fraud_model.json on disk) with verified,
 * static held-out test evaluation results (see backend/modelTelemetry.js
 * for full provenance). Does not touch the transaction pipeline,
 * the ML service, or the model artifact.
 */

app.get("/model/telemetry", (req, res) => {
  try {
    return res.status(200).json(getModelTelemetry());
  } catch (error) {
    console.error("Failed to load model telemetry:", error.message);

    return res.status(500).json({
      message: "Failed to load model telemetry",
      error: error.message
    });
  }
});

/*
 * ============================================================
 * PERSISTED TRANSACTION HISTORY
 * ============================================================
 */

app.get("/transactions/history", async (req, res) => {
  try {
    const limit = req.query.limit || 100;

    const transactions = await getTransactionHistory(limit);

    return res.status(200).json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error(
      "Failed to fetch transaction history:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to fetch transaction history",
      error: error.message
    });
  }
});


/*
 * ============================================================
 * TRANSACTION PROCESSING
 * ============================================================
 */

app.post("/transactions", async (req, res) => {
  const requestStartedAt = performance.now();
  const transaction = req.body;

  console.log("Received transaction:", transaction);

  /*
   * 1. Validate transaction
   */

  const validation = validateTransaction(transaction);

  if (!validation.valid) {
    return res.status(400).json({
      message: "Invalid transaction",
      errors: validation.errors
    });
  }

  try {
    /*
     * 2. Check duplicate transaction ID
     */

    const duplicateCheck = await pool.query(
      `SELECT transaction_id
       FROM transactions
       WHERE transaction_id = $1
       LIMIT 1`,
      [transaction.transactionId]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: "Duplicate transaction",
        error: "This transaction ID has already been processed"
      });
    }

    /*
     * 3. Store transaction in PostgreSQL
     */

    await pool.query(
      `INSERT INTO transactions
       (transaction_id, user_id, amount, currency)
       VALUES ($1, $2, $3, $4)`,
      [
        transaction.transactionId,
        transaction.userId,
        transaction.amount,
        transaction.currency
      ]
    );

    updateServiceTelemetry({
      databaseAvailable: true
    });

    /*
     * 4. Fetch recent transactions
     */

    const recentTransactions = await getRecentTransactions(
      transaction.userId
    );

    /*
     * 5. Remove current transaction from behavioral history
     */

    const previousTransactions = recentTransactions.filter(
      tx => tx.transaction_id !== transaction.transactionId
    );

    console.log("VELOCITY DEBUG:", {
      fetched: recentTransactions.length,
      previous: previousTransactions.length,
      userId: transaction.userId
    });

    /*
     * 6. Rule-based risk engine
     */

    const riskResult = calculateRisk(
      transaction,
      previousTransactions
    );

    console.log("Rules result:", riskResult);

    /*
     * 7. ML risk service
     */

    let mlResult;

    try {
      const mlResponse = await fetch(
        `${ML_SERVICE_URL}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            step: transaction.step,
            amount: transaction.amount,
            oldbalanceOrg: transaction.oldbalanceOrg,
            newbalanceOrig: transaction.newbalanceOrig,
            oldbalanceDest: transaction.oldbalanceDest,
            newbalanceDest: transaction.newbalanceDest,
            type: transaction.type
          })
        }
      );

      if (!mlResponse.ok) {
        throw new Error(
          `ML service returned HTTP ${mlResponse.status}`
        );
      }

      const prediction = await mlResponse.json();

      mlResult = {
        fraudProbability: Number(
          prediction.fraud_probability || 0
        ),

        isFraud: Number(
          prediction.is_fraud || 0
        ),

        explanation: prediction.explanation || {
          top_features: []
        }
      };

      console.log("ML result:", prediction);

      updateServiceTelemetry({
        mlServiceAvailable: true
      });

    } catch (mlError) {

      console.error(
        "ML Risk Service unavailable:",
        mlError.message
      );

      updateServiceTelemetry({
        mlServiceAvailable: false
      });

      // Persist failure so the transaction is not left stuck
      // in PROCESSING state.
      await updateTransactionOutcome(
        transaction.transactionId,
        {
          processingStatus: "FAILED",
          failureReason: `ML Risk Service unavailable: ${mlError.message}`
        }
      );

      recordTransactionTelemetry({
        latencyMs: performance.now() - requestStartedAt,
        success: false
      });

      return res.status(503).json({
        message:
          "Transaction received but ML risk service is unavailable",

        service: "ML Risk Service",

        status: "UNAVAILABLE",

        rules: riskResult
      });
    }

    /*
     * 8. Risk fusion
     */

    const fusionResult = calculateFinalRisk(
      riskResult.riskScore,
      mlResult.fraudProbability
    );

    console.log(
      "Risk fusion result:",
      fusionResult
    );

    /*
     * 9. Human-readable explanation
     */

    const explanation = explainRisk(
      riskResult,
      mlResult,
      fusionResult
    );

    console.log(
      "Explanation:",
      explanation
    );

    /*
     * 10. Persist final transaction outcome
     */

    await updateTransactionOutcome(
      transaction.transactionId,
      {
        processingStatus: "COMPLETED",
        ruleRiskScore: riskResult.riskScore,
        mlProbability: mlResult.fraudProbability,
        finalRiskScore: fusionResult.finalRiskScore,
        decision: fusionResult.decision,
        signals: riskResult.signals,
        explanation
      }
    );

    /*
     * 11. Runtime telemetry
     */

    recordTransactionTelemetry({
      decision: fusionResult.finalDecision || fusionResult.decision,
      latencyMs: performance.now() - requestStartedAt,
      success: true
    });

    /*
     * 11. Final response
     */

    return res.status(200).json({
      rules: riskResult,

      ml: mlResult,

      fusion: fusionResult,

      explanation
    });

  } catch (error) {

    console.error(
      "Transaction processing failed:",
      error.message
    );

    if (error.code) {
      updateServiceTelemetry({
        databaseAvailable: false
      });
    }

    // Best-effort failure persistence. Do not mask the original
    // processing error if the database update itself fails.
    try {
      await updateTransactionOutcome(
        transaction.transactionId,
        {
          processingStatus: "FAILED",
          failureReason: error.message
        }
      );
    } catch (persistenceError) {
      console.error(
        "Failed to persist transaction failure:",
        persistenceError.message
      );
    }

    recordTransactionTelemetry({
      latencyMs: performance.now() - requestStartedAt,
      success: false
    });

    /*
     * Handle PostgreSQL duplicate race condition
     */

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Duplicate transaction",
        error: "This transaction ID has already been processed"
      });
    }

    return res.status(500).json({
      message: "Failed to process transaction",
      error: error.message
    });
  }
});

/*
 * ============================================================
 * SERVER START
 * ============================================================
 */

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(
    `Sentinel running on http://localhost:${PORT}`
  );
});

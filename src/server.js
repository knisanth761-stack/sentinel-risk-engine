require("dotenv").config();
const express = require("express");

const { pool, getRecentTransactions } = require("./database");
const calculateRisk = require("./riskEngine");
const calculateFinalRisk = require("./riskFusion");
const explainRisk = require("./explanationEngine");
const validateTransaction = require("./validateTransaction");

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
 * TRANSACTION PROCESSING
 * ============================================================
 */

app.post("/transactions", async (req, res) => {
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
        "http://localhost:8000/predict",
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

    } catch (mlError) {

      console.error(
        "ML Risk Service unavailable:",
        mlError.message
      );

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
     * 10. Final response
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

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `Sentinel running on http://localhost:${PORT}`
  );
});

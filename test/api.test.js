const test = require("node:test");
const assert = require("node:assert/strict");

require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

const API = "http://localhost:3000";

async function createTransaction(overrides = {}) {
  const transaction = {
    transactionId: `test-${Date.now()}-${Math.random()}`,
    userId: `integration-user-${Date.now()}`,
    amount: 100,
    currency: "INR",
    step: 400,
    oldbalanceOrg: 10000,
    newbalanceOrig: 9900,
    oldbalanceDest: 5000,
    newbalanceDest: 5100,
    type: "PAYMENT",
    ...overrides
  };

  const response = await fetch(`${API}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
  });

  const body = await response.json();

  return {
    status: response.status,
    body
  };
}

test("health endpoint is available", async () => {
  const response = await fetch(`${API}/health`);

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.status, "UP");
  assert.equal(body.service, "Sentinel Risk Engine");
});

test("normal transaction completes through the pipeline", async () => {
  const { status, body } = await createTransaction();

  assert.equal(status, 200);

  assert.ok(body.rules);
  assert.ok(body.ml);
  assert.ok(body.fusion);
  assert.ok(body.explanation);

  assert.equal(body.fusion.decision, "SAFE");
});

test("high-value transaction is blocked", async () => {
  const { status, body } = await createTransaction({
    transactionId: `high-${Date.now()}`,
    userId: `high-user-${Date.now()}`,
    amount: 900000,
    oldbalanceOrg: 1000000,
    newbalanceOrig: 100000,
    oldbalanceDest: 0,
    newbalanceDest: 900000,
    type: "TRANSFER"
  });

  assert.equal(status, 200);

  assert.ok(body.rules.riskScore >= 70);
  assert.equal(body.rules.decision, "BLOCK");
  assert.equal(body.fusion.decision, "BLOCK");
});

test("ML can escalate a subtle fraud transaction", async () => {
  const { status, body } = await createTransaction({
    transactionId: `ml-${Date.now()}`,
    userId: `ml-user-${Date.now()}`,
    amount: 119.65,
    step: 653,
    oldbalanceOrg: 119.65,
    newbalanceOrig: 0,
    oldbalanceDest: 0,
    newbalanceDest: 0,
    type: "TRANSFER"
  });

  assert.equal(status, 200);

  assert.ok(body.ml.fraudProbability > 0.99);
  assert.equal(body.ml.isFraud, 1);

  assert.equal(body.fusion.decision, "BLOCK");
});

test("velocity detection works through the API", async () => {
  const userId = `velocity-${Date.now()}`;

  for (let i = 0; i < 5; i++) {
    await createTransaction({
      transactionId: `velocity-${Date.now()}-${i}`,
      userId,
      amount: 100,
      type: "PAYMENT"
    });
  }

  const { status, body } = await createTransaction({
    transactionId: `velocity-final-${Date.now()}`,
    userId,
    amount: 100,
    type: "PAYMENT"
  });

  assert.equal(status, 200);

  assert.ok(
    body.rules.signals.some(
      signal => signal.type === "HIGH_VELOCITY"
    )
  );

  assert.equal(body.rules.decision, "REVIEW");
});

test("invalid transaction is rejected", async () => {
  const response = await fetch(`${API}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transactionId: `invalid-${Date.now()}`
    })
  });

  assert.notEqual(response.status, 200);
});

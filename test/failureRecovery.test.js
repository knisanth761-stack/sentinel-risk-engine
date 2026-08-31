const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");

require("dotenv").config();

const { Pool } = require("pg");

const TEST_PORT = 3001;
const API = `http://localhost:${TEST_PORT}`;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

let serverProcess;

async function waitForServer() {
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${API}/health`);

      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw new Error("Test server failed to start");
}

test.before(async () => {
  serverProcess = spawn(
    "node",
    ["backend/server.js"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        ML_SERVICE_URL: "http://localhost:9999"
      },
      stdio: "pipe"
    }
  );

  await waitForServer();
});

test.after(async () => {
  if (serverProcess) {
    serverProcess.kill();
  }

  await pool.end();
});

test(
  "ML service failure is persisted as FAILED",
  async () => {
    const transactionId =
      `failure-test-${Date.now()}`;

    const transaction = {
      transactionId,
      userId: `failure-user-${Date.now()}`,
      amount: 100,
      currency: "INR",
      step: 400,
      oldbalanceOrg: 10000,
      newbalanceOrig: 9900,
      oldbalanceDest: 5000,
      newbalanceDest: 5100,
      type: "PAYMENT"
    };

    const response = await fetch(
      `${API}/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(transaction)
      }
    );

    assert.equal(response.status, 503);

    const result = await pool.query(
      `SELECT
         processing_status,
         failure_reason,
         processed_at
       FROM transactions
       WHERE transaction_id = $1`,
      [transactionId]
    );

    assert.equal(result.rows.length, 1);

    const saved = result.rows[0];

    assert.equal(
      saved.processing_status,
      "FAILED"
    );

    assert.ok(saved.failure_reason);
    assert.match(
      saved.failure_reason,
      /ML Risk Service unavailable/
    );

    assert.ok(saved.processed_at);
  }
);

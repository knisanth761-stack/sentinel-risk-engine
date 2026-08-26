const test = require("node:test");
const assert = require("node:assert/strict");

const calculateRisk = require("../src/riskEngine");

function tx(overrides = {}) {
  return {
    amount: 100,
    oldbalanceOrg: 10000,
    newbalanceOrig: 9900,
    oldbalanceDest: 5000,
    newbalanceDest: 5100,
    type: "PAYMENT",
    ...overrides
  };
}

test("normal transaction is SAFE", () => {
  const result = calculateRisk(tx(), []);

  assert.equal(result.riskScore, 0);
  assert.equal(result.signals.length, 0);
});

test("high amount triggers HIGH_AMOUNT", () => {
  const result = calculateRisk(
    tx({ amount: 50000 }),
    []
  );

  assert.ok(
    result.signals.some(
      signal => signal.type === "HIGH_AMOUNT"
    )
  );
});

test("50% balance depletion adds 10 risk", () => {
  const result = calculateRisk(
    tx({
      amount: 5000,
      oldbalanceOrg: 10000,
      newbalanceOrig: 5000
    }),
    []
  );

  assert.ok(
    result.signals.some(
      signal =>
        signal.type === "SOURCE_BALANCE_DEPLETION" &&
        signal.score === 10
    )
  );
});

test("75% balance depletion adds 20 risk", () => {
  const result = calculateRisk(
    tx({
      amount: 7500,
      oldbalanceOrg: 10000,
      newbalanceOrig: 2500
    }),
    []
  );

  assert.ok(
    result.signals.some(
      signal =>
        signal.type === "SOURCE_BALANCE_DEPLETION" &&
        signal.score === 20
    )
  );
});

test("90% balance depletion adds 30 risk", () => {
  const result = calculateRisk(
    tx({
      amount: 9000,
      oldbalanceOrg: 10000,
      newbalanceOrig: 1000
    }),
    []
  );

  assert.ok(
    result.signals.some(
      signal =>
        signal.type === "SOURCE_BALANCE_DEPLETION" &&
        signal.score === 30
    )
  );
});

test("high velocity is detected after more than 3 transactions", () => {
  const recentTransactions = [
    { amount: 100 },
    { amount: 100 },
    { amount: 100 },
    { amount: 100 }
  ];

  const result = calculateRisk(
    tx(),
    recentTransactions
  );

  assert.ok(
    result.signals.some(
      signal => signal.type === "HIGH_VELOCITY"
    )
  );
});

test("behavioral anomaly detects 5x spending increase", () => {
  const recentTransactions = [
    { amount: 100 },
    { amount: 100 }
  ];

  const result = calculateRisk(
    tx({ amount: 500 }),
    recentTransactions
  );

  assert.ok(
    result.signals.some(
      signal => signal.type === "BEHAVIORAL_ANOMALY"
    )
  );
});

test("source balance mismatch is detected", () => {
  const result = calculateRisk(
    tx({
      amount: 1000,
      oldbalanceOrg: 10000,
      newbalanceOrig: 5000
    }),
    []
  );

  assert.ok(
    result.signals.some(
      signal => signal.type === "SOURCE_BALANCE_MISMATCH"
    )
  );
});

test("high-risk TRANSFER is detected", () => {
  const result = calculateRisk(
    tx({
      amount: 100000,
      type: "TRANSFER"
    }),
    []
  );

  assert.ok(
    result.signals.some(
      signal => signal.type === "HIGH_RISK_TRANSACTION_TYPE"
    )
  );
});

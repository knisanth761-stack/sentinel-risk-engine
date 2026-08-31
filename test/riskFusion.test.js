const test = require("node:test");
const assert = require("node:assert/strict");

const calculateFinalRisk = require("../backend/riskFusion");

test("risk 0 is SAFE", () => {
  const result = calculateFinalRisk(0, 0);

  assert.equal(result.decision, "SAFE");
});

test("risk 24 is SAFE", () => {
  const result = calculateFinalRisk(24, 0);

  assert.equal(result.decision, "SAFE");
});

test("risk 25 is REVIEW", () => {
  const result = calculateFinalRisk(25, 0);

  assert.equal(result.decision, "REVIEW");
});

test("risk 39 is REVIEW", () => {
  const result = calculateFinalRisk(39, 0);

  assert.equal(result.decision, "REVIEW");
});

test("risk 40 is SUSPICIOUS", () => {
  const result = calculateFinalRisk(40, 0);

  assert.equal(result.decision, "SUSPICIOUS");
});

test("risk 69 is SUSPICIOUS", () => {
  const result = calculateFinalRisk(69, 0);

  assert.equal(result.decision, "SUSPICIOUS");
});

test("risk 70 is BLOCK", () => {
  const result = calculateFinalRisk(70, 0);

  assert.equal(result.decision, "BLOCK");
});

test("ML catches subtle fraud", () => {
  const result = calculateFinalRisk(
    38,
    0.999982
  );

  assert.equal(result.decision, "BLOCK");
});

test("rules protect against ML miss", () => {
  const result = calculateFinalRisk(
    75,
    0.01
  );

  assert.equal(result.decision, "BLOCK");
});

test("strong rule and ML risk results in BLOCK", () => {
  const result = calculateFinalRisk(
    80,
    0.80
  );

  assert.equal(result.decision, "BLOCK");
});

test("extreme fraud results in BLOCK", () => {
  const result = calculateFinalRisk(
    100,
    1.0
  );

  assert.equal(result.decision, "BLOCK");
});

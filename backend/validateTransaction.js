function validateTransaction(tx) {
  const errors = [];

  if (!tx.transactionId || typeof tx.transactionId !== "string") {
    errors.push("transactionId is required");
  }

  if (!tx.userId || typeof tx.userId !== "string") {
    errors.push("userId is required");
  }

  if (typeof tx.amount !== "number" || tx.amount <= 0) {
    errors.push("amount must be a positive number");
  }

  if (!tx.currency || typeof tx.currency !== "string") {
    errors.push("currency is required");
  }

  if (!Number.isInteger(tx.step) || tx.step < 0) {
    errors.push("step must be a non-negative integer");
  }

  const balanceFields = [
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest"
  ];

  for (const field of balanceFields) {
    if (typeof tx[field] !== "number" || tx[field] < 0) {
      errors.push(`${field} must be a non-negative number`);
    }
  }

  const allowedTypes = [
    "CASH_IN",
    "CASH_OUT",
    "DEBIT",
    "PAYMENT",
    "TRANSFER"
  ];

  if (!allowedTypes.includes(tx.type)) {
    errors.push(
      `type must be one of: ${allowedTypes.join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = validateTransaction;

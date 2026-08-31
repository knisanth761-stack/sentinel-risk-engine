CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,

    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(100) NOT NULL,

    amount NUMERIC NOT NULL,
    currency VARCHAR(10),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    processing_status VARCHAR(20) DEFAULT 'PROCESSING',

    rule_risk_score NUMERIC,
    ml_probability NUMERIC,
    final_risk_score NUMERIC,

    decision VARCHAR(20),

    signals JSONB,
    explanation JSONB,

    processed_at TIMESTAMP,

    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
ON transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
ON transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_decision
ON transactions (decision);

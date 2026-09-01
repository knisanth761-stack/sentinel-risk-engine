# 🛡️ Sentinel Risk Engine

> A hybrid, explainable fraud detection system that combines a rule-based risk engine with an XGBoost machine-learning model to analyze financial transactions in real time.

## 🚀 Overview

**Sentinel Risk Engine** is a full-stack transaction fraud detection system designed to evaluate financial transactions using multiple layers of risk analysis.

Instead of relying on a single detection method, Sentinel combines:

- 📏 **Rule-Based Risk Detection** for transparent behavioral and transaction-based checks
- 🤖 **XGBoost Machine Learning** for identifying complex fraud patterns
- 🔀 **Risk Fusion** to combine rule-based and ML risk into a final decision
- 💬 **Human-Readable Explanations** describing why a transaction was flagged
- 🗄️ **PostgreSQL Persistence** for transaction history and processing outcomes
- 📊 **Model & Runtime Telemetry** for monitoring model, service, and transaction performance
- 🧪 **Automated Tests** covering rules, risk fusion, API integration, and failure recovery

The system processes each transaction through a complete risk pipeline and returns a final decision:

```text
SAFE → REVIEW → SUSPICIOUS → BLOCK

✨ Key Features
Real-time transaction risk analysis
Hybrid rule-based + machine-learning fraud detection
Configurable transaction risk signals
Behavioral anomaly detection
Transaction velocity detection
Source balance depletion analysis
Balance consistency checks
High-risk transaction type detection
Risk fusion between rules and ML predictions
Human-readable fraud explanations
SHAP-based ML feature explanations
PostgreSQL transaction persistence
Duplicate transaction detection
ML service failure recovery
Persisted transaction history
Model telemetry and feature importance
Live backend runtime telemetry
Automated unit and integration testing

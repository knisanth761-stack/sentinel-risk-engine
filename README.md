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
```

## ✨ Key Features

1. Real-time transaction risk analysis
2. Hybrid rule-based + machine-learning fraud detection
3. Configurable transaction risk signals
4. Behavioral anomaly detection
5. Transaction velocity detection
6. Source balance depletion analysis
7. Balance consistency checks
8. High-risk transaction type detection
9. Risk fusion between rules and ML predictions
10. Human-readable fraud explanations
11. SHAP-based ML feature explanations
12. PostgreSQL transaction persistence
13. Duplicate transaction detection
14. ML service failure recovery
15. Persisted transaction history
16. Model telemetry and feature importance
17. Live backend runtime telemetry
18. Automated unit and integration testing

## 🏗️ System Architecture

Sentinel Risk Engine uses a hybrid architecture that combines deterministic rule-based analysis, machine-learning fraud detection, risk fusion, explainability, persistent transaction storage, and a real-time React dashboard.

![Sentinel Risk Engine Architecture](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/Architecture.png)

## 📊 Model Performance & Evaluation

The fraud detection model was evaluated using an **untouched held-out test set** containing **123,580 transactions**.

> **Evaluation approach:** The deployed XGBoost model artifact was loaded directly and evaluated without retraining. The held-out test set was not used during model training.

### 🎯 Performance Metrics

| Metric | Score |
|---|---:|
| **Precision** | **1.0000** |
| **Recall** | **0.9994** |
| **F1 Score** | **0.9997** |
| **PR-AUC** | **1.0000** |
| **ROC-AUC** | **1.0000** |
| **False Positive Rate** | **0.000000** |

### 🔍 Held-Out Test Results

| Actual / Predicted | Legitimate | Fraud |
|---|---:|---:|
| **Legitimate** | 121,926 | 0 |
| **Fraud** | 1 | 1,653 |

- **True Positives:** 1,653
- **True Negatives:** 121,926
- **False Positives:** 0
- **False Negatives:** 1
- **Fraud Cases:** 1,654
- **Fraud Detection Rate:** 99.94%

### ⚠️ Evaluation Note

These metrics were obtained from a held-out evaluation dataset and represent offline model performance. They should not be interpreted as a guarantee of identical production performance.

## 💰 Business Impact

The deployed model was also evaluated on the same untouched held-out test set to estimate potential fraud-loss prevention.

### Fraud Amount Impact

| Metric | Value |
|---|---:|
| **Total Fraud Exposure Evaluated** | 2,722,434,569.36 |
| **Fraud Amount Detected** | 2,722,035,524.28 |
| **Fraud Amount Missed** | 399,045.08 |
| **Fraud Amount Prevention Rate** | **99.9853%** |
| **Fraud Amount Leakage Rate** | **0.0147%** |
| **Legitimate Amount Incorrectly Flagged** | **0** |

### Operational Impact

- **1,653 of 1,654 fraud cases detected**
- **0 legitimate transactions incorrectly flagged**
- Only **1 fraud case missed**
- Strong fraud detection with minimal customer friction on the evaluated dataset

> ⚠️ These figures represent performance on the held-out evaluation dataset and are not guaranteed production savings. Real-world results may vary depending on data distribution and transaction patterns.

## 🔍 Explainable AI & Risk Reasoning

Sentinel AI Risk Manager does not operate as a black-box fraud detector. Each transaction is analyzed using multiple layers of risk intelligence and returns human-readable reasons behind the final decision.

### 🧠 Rule-Based Risk Signals

The deterministic risk engine analyzes transaction patterns including:

- High transaction amounts
- High transaction velocity
- Behavioral anomalies
- Source account balance depletion
- Source and destination balance inconsistencies
- High-risk transaction types
- Rapid cumulative spending

Each detected signal contributes to the overall rule-based risk score.

### 🤖 Machine Learning Explainability

For transactions identified as suspicious by the ML model, Sentinel analyzes important fraud-driving features and converts them into understandable explanations.

The explanation system can highlight patterns such as:

- Unusual source-account balance patterns
- Large movements from the source account
- Transactions that significantly deplete account balances
- Transaction amounts that are unusually large
- Unusual destination balance changes
- High amounts relative to account balances
- Unusual transaction timing patterns

### 🔗 Multi-Layer Risk Explanation

**Rule Signals** → Deterministic risk patterns  
**ML Feature Explanations** → Fraud-driving model features  
**ML Confidence** → Probability of fraud  
**Risk Fusion** → Final SAFE / REVIEW / SUSPICIOUS / BLOCK decision

Duplicate reasons are removed before the final explanation is returned to the user.

### Example Decision Output

```text
Decision: BLOCK

Reasons:
• Transaction amount is unusually high
• Transaction consumes almost the entire source account balance
• Large TRANSFER transaction requires additional scrutiny
• The machine-learning model assigns a high probability of fraud
```

## 🛠️ Technology Stack

| Technology | Role |
|---|---|
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/react.svg" width="32" height="32" alt="React"> **React** | Interactive frontend dashboard |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/vite.svg" width="32" height="32" alt="Vite"> **Vite** | Frontend development and build tool |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/nodejs.svg" width="32" height="32" alt="Node.js"> **Node.js** | Backend runtime |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/express.svg" width="32" height="32" alt="Express.js"> **Express.js** | REST API framework |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/python.svg" width="32" height="32" alt="Python"> **Python** | Machine-learning service |
| **XGBoost** | Fraud detection model |
| **SHAP** | Model explainability |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/postgresql.svg" width="32" height="32" alt="PostgreSQL"> **PostgreSQL** | Transaction and risk persistence |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/docker.svg" width="32" height="32" alt="Docker"> **Docker** | Containerization and deployment |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/git.svg" width="32" height="32" alt="Git"> **Git** | Version control |
| <img src="https://raw.githubusercontent.com/knisanth761-stack/sentinel-risk-engine/main/docs/images/stack/github.svg" width="32" height="32" alt="GitHub"> **GitHub** | Repository hosting and collaboration |

## 🖥️ Dashboard Screens

### Command Center

![Command Center Overview](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/command-center-overview.png)

![Command Center Details](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/command-center-bottom.png)

### Transaction Analysis

![Transaction Analysis](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/transaction-analysis-overview.png)

![Risk Decision](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/transaction-analysis-decision.png)

![Risk Explanation](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/transaction-analysis-explanation.png)

### Risk Events

![Risk Events](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/risk-events-overview.png)

![Risk Event Details](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/risk-events-bottom.png)

### Model Intelligence

![Model Intelligence Overview](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/model-intelligence-overview.png)

![Model Performance](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/model-intelligence-performance.png)

![Business Impact](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/model-intelligence-business-impact.png)

![Explainability](https://github.com/knisanth761-stack/sentinel-risk-engine/raw/main/docs/images/model-intelligence-explainability.png)

## 🐳 Run with Docker

Sentinel Risk Engine is containerized with Docker Compose and runs as four services:

- **Frontend** — React dashboard on port `5173`
- **Backend** — Node.js API on port `3000`
- **ML Service** — Python/XGBoost inference service on port `8000`
- **PostgreSQL 16** — persistent transaction database on port `5432`

### Prerequisites

- Git
- Docker
- Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/knisanth761-stack/sentinel-risk-engine.git
cd sentinel-risk-engine
```

### 2. Build and Start the System

```bash
docker compose up --build
```

The application will be available at:

| Service | URL |
|---|---|
| Frontend Dashboard | `http://localhost:5173` |
| Backend API | `http://localhost:3000` |
| ML Service | `http://localhost:8000` |
| PostgreSQL | `localhost:5432` |

Docker Compose automatically starts PostgreSQL, the ML service, backend, and frontend. The backend waits for the PostgreSQL health check before starting.

### Run in Detached Mode

```bash
docker compose up --build -d
```

### View Service Logs

```bash
docker compose logs -f
```

### Stop the System

```bash
docker compose down
```

### Stop and Remove Persistent Database Data

```bash
docker compose down -v
```

> ⚠️ The `-v` option removes the PostgreSQL Docker volume and permanently deletes the local database data.

## 🔄 System Flow

```text
Transaction Input
       ↓
Input Validation
       ↓
Duplicate Detection
       ↓
Transaction Persistence
       ↓
Rule-Based Risk Analysis
       ↓
Machine Learning Prediction
       ↓
Risk Fusion
       ↓
Explainability
       ↓
Final Decision
SAFE / REVIEW / SUSPICIOUS / BLOCK
```

## 🔌 API Endpoints

The backend API runs on port `3000` by default.

### Health Check

```http
GET /health
```

Returns the backend service status.

**Example response:**

```json
{
  "status": "UP",
  "service": "Sentinel Risk Engine"
}
```

### Process a Transaction

```http
POST /transactions
```

Validates, persists, and analyzes a transaction using the rule-based engine and machine-learning service.

**Possible outcomes include:**

```text
SAFE
REVIEW
SUSPICIOUS
BLOCK
```

### Transaction History

```http
GET /transactions/history
```

Returns persisted transaction history.

An optional `limit` query parameter can be used:

```http
GET /transactions/history?limit=50
```

### Model Telemetry

```http
GET /model/telemetry
```

Returns model metadata, held-out evaluation results, and runtime telemetry information.

## 🧪 Testing

The project includes automated unit and integration tests covering core risk logic, API behavior, persistence, validation, and failure recovery.

### Unit Tests

```bash
npm test
```

This runs the core risk engine and risk fusion tests.

### Integration Tests

```bash
npm run test:integration
```

Integration tests cover API processing, transaction persistence, validation, duplicate handling, and failure recovery scenarios.

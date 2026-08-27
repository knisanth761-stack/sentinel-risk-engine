from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import xgboost as xgb

from ml.explainer import explain_prediction


app = FastAPI(title="Sentinel ML Risk Service")

MODEL_PATH = "ml/xgboost_fraud_model.json"

model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)


class Transaction(BaseModel):
    step: int
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    type: str


def build_features(tx: Transaction):

    balance_change_orig = (
        tx.oldbalanceOrg - tx.newbalanceOrig
    )

    balance_change_dest = (
        tx.newbalanceDest - tx.oldbalanceDest
    )

    amount_to_oldbalance_orig = (
        tx.amount / (tx.oldbalanceOrg + 1)
    )

    amount_to_oldbalance_dest = (
        tx.amount / (tx.oldbalanceDest + 1)
    )

    # MUST match ml/create_splits.py exactly.
    # These are signed errors, not absolute values.
    orig_balance_error = (
        tx.oldbalanceOrg - tx.amount - tx.newbalanceOrig
    )

    dest_balance_error = (
        tx.oldbalanceDest + tx.amount - tx.newbalanceDest
    )

    return pd.DataFrame([{
        "step": tx.step,
        "amount": tx.amount,
        "oldbalanceOrg": tx.oldbalanceOrg,
        "newbalanceOrig": tx.newbalanceOrig,
        "oldbalanceDest": tx.oldbalanceDest,
        "newbalanceDest": tx.newbalanceDest,
        "balance_change_orig": balance_change_orig,
        "balance_change_dest": balance_change_dest,
        "amount_to_oldbalance_orig": amount_to_oldbalance_orig,
        "amount_to_oldbalance_dest": amount_to_oldbalance_dest,
        "orig_balance_error": orig_balance_error,
        "dest_balance_error": dest_balance_error,
        "type_CASH_IN": int(tx.type == "CASH_IN"),
        "type_CASH_OUT": int(tx.type == "CASH_OUT"),
        "type_DEBIT": int(tx.type == "DEBIT"),
        "type_PAYMENT": int(tx.type == "PAYMENT"),
        "type_TRANSFER": int(tx.type == "TRANSFER"),
    }])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "XGBoost",
        "features": len(model.get_booster().feature_names),
        "trees": model.get_booster().num_boosted_rounds()
    }


@app.post("/predict")
def predict(tx: Transaction):

    # 1. Build model features
    features = build_features(tx)

    # 2. XGBoost prediction
    probability = float(
        model.predict_proba(features)[0][1]
    )

    # 3. Fraud threshold
    threshold = 0.99

    prediction = int(probability >= threshold)

    # 4. SHAP explanation
    explanations = explain_prediction(features)

    # Only expose the top 5 contributors
    top_explanations = explanations[:5]

    # 5. Return ML + SHAP result
    return {
        "fraud_probability": round(probability, 6),
        "threshold": threshold,
        "is_fraud": prediction,
        "explanation": {
            "top_features": top_explanations
        }
    }

import shap
import pandas as pd
import xgboost as xgb

MODEL_PATH = "ml/xgboost_fraud_model.json"

model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)

explainer = shap.TreeExplainer(model)


FEATURE_NAMES = [
    "step",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "balance_change_orig",
    "balance_change_dest",
    "amount_to_oldbalance_orig",
    "amount_to_oldbalance_dest",
    "orig_balance_error",
    "dest_balance_error",
    "type_CASH_IN",
    "type_CASH_OUT",
    "type_DEBIT",
    "type_PAYMENT",
    "type_TRANSFER",
]


def explain_prediction(features: pd.DataFrame):

    shap_values = explainer.shap_values(features)

    # Handle binary classification output
    if isinstance(shap_values, list):
        values = shap_values[1][0]
    else:
        values = shap_values[0]

    feature_values = features.iloc[0].to_dict()

    explanations = []

    for feature, shap_value in zip(FEATURE_NAMES, values):

        explanations.append({
            "feature": feature,
            "value": feature_values[feature],
            "shapValue": round(float(shap_value), 6),
            "impact": (
                "INCREASES_FRAUD_RISK"
                if shap_value > 0
                else "DECREASES_FRAUD_RISK"
            )
        })

    # Most influential features first
    explanations.sort(
        key=lambda x: abs(x["shapValue"]),
        reverse=True
    )

    return explanations

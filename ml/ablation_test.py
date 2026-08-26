import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    average_precision_score,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score
)

TRAIN_PATH = "data/processed/train.csv"
VAL_PATH = "data/processed/validation.csv"

train = pd.read_csv(TRAIN_PATH)
val = pd.read_csv(VAL_PATH)

# Remove engineered balance-derived features
remove_features = [
    "balance_change_orig",
    "balance_change_dest",
    "orig_balance_error",
    "dest_balance_error"
]

X_train = train.drop(columns=["isFraud"] + remove_features)
y_train = train["isFraud"]

X_val = val.drop(columns=["isFraud"] + remove_features)
y_val = val["isFraud"]

scale_pos_weight = (
    (y_train == 0).sum() /
    (y_train == 1).sum()
)

print("Features:", X_train.columns.tolist())
print("scale_pos_weight:", scale_pos_weight)

model = xgb.XGBClassifier(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.08,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=5,
    objective="binary:logistic",
    eval_metric="aucpr",
    scale_pos_weight=scale_pos_weight,
    tree_method="hist",
    n_jobs=-1,
    random_state=42
)

print("\nTraining ablation model...")

model.fit(
    X_train,
    y_train,
    eval_set=[(X_val, y_val)],
    verbose=100
)

val_prob = model.predict_proba(X_val)[:, 1]
val_pred = (val_prob >= 0.5).astype(int)

print("\n===== ABLATION RESULTS =====")
print(f"PR-AUC    : {average_precision_score(y_val, val_prob):.4f}")
print(f"ROC-AUC   : {roc_auc_score(y_val, val_prob):.4f}")
print(f"Precision : {precision_score(y_val, val_pred, zero_division=0):.4f}")
print(f"Recall    : {recall_score(y_val, val_pred, zero_division=0):.4f}")
print(f"F1        : {f1_score(y_val, val_pred, zero_division=0):.4f}")

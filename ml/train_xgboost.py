import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    average_precision_score,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

TRAIN_PATH = "data/processed/train.csv"
VAL_PATH = "data/processed/validation.csv"

print("Loading data...")

train = pd.read_csv(TRAIN_PATH)
val = pd.read_csv(VAL_PATH)

X_train = train.drop(columns=["isFraud"])
y_train = train["isFraud"]

X_val = val.drop(columns=["isFraud"])
y_val = val["isFraud"]

print("Train:", X_train.shape)
print("Validation:", X_val.shape)

# Handle extreme class imbalance.
# Approximate ratio of legitimate/fraud transactions in training.
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

print("scale_pos_weight:", scale_pos_weight)

model = xgb.XGBClassifier(
    n_estimators=600,
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

print("\nTraining XGBoost...")

model.fit(
    X_train,
    y_train,
    eval_set=[(X_val, y_val)],
    verbose=50
)

print("\nTraining complete.")

# Validation probabilities
val_prob = model.predict_proba(X_val)[:, 1]

# Evaluate ranking quality
pr_auc = average_precision_score(y_val, val_prob)
roc_auc = roc_auc_score(y_val, val_prob)

print("\n===== XGBOOST RANKING RESULTS =====")
print(f"PR-AUC  : {pr_auc:.4f}")
print(f"ROC-AUC : {roc_auc:.4f}")

# Baseline operating threshold
threshold = 0.5
val_pred = (val_prob >= threshold).astype(int)

precision = precision_score(y_val, val_pred, zero_division=0)
recall = recall_score(y_val, val_pred, zero_division=0)
f1 = f1_score(y_val, val_pred, zero_division=0)

tn, fp, fn, tp = confusion_matrix(
    y_val,
    val_pred
).ravel()

fpr = fp / (fp + tn)

print("\n===== THRESHOLD 0.50 =====")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1        : {f1:.4f}")
print(f"FPR       : {fpr:.6f}")

print("\n===== CONFUSION MATRIX =====")
print(confusion_matrix(y_val, val_pred))

# Save model
model.save_model("ml/xgboost_fraud_model.json")

print("\nModel saved to:")
print("ml/xgboost_fraud_model.json")

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
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

print("\nTraining Logistic Regression...")

model = LogisticRegression(
    class_weight="balanced",
    max_iter=1000,
    solver="liblinear"
)

model.fit(X_train, y_train)

print("Training complete.")

# Fraud probabilities
val_prob = model.predict_proba(X_val)[:, 1]

# Baseline threshold
threshold = 0.5
val_pred = (val_prob >= threshold).astype(int)

precision = precision_score(y_val, val_pred, zero_division=0)
recall = recall_score(y_val, val_pred, zero_division=0)
f1 = f1_score(y_val, val_pred, zero_division=0)
pr_auc = average_precision_score(y_val, val_prob)
roc_auc = roc_auc_score(y_val, val_prob)

tn, fp, fn, tp = confusion_matrix(
    y_val,
    val_pred
).ravel()

fpr = fp / (fp + tn)

print("\n===== BASELINE RESULTS =====")
print(f"Threshold : {threshold}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1        : {f1:.4f}")
print(f"PR-AUC    : {pr_auc:.4f}")
print(f"ROC-AUC   : {roc_auc:.4f}")
print(f"FPR       : {fpr:.6f}")

print("\n===== CONFUSION MATRIX =====")
print(confusion_matrix(y_val, val_pred))

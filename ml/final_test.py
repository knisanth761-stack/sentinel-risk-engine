import pandas as pd
import xgboost as xgb

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    confusion_matrix
)

TRAIN_PATH = "data/processed/train.csv"
TEST_PATH = "data/processed/test.csv"

THRESHOLD = 0.99

REMOVE_FEATURES = [
    "balance_change_orig",
    "balance_change_dest",
    "orig_balance_error",
    "dest_balance_error"
]

print("Loading training data...")
train = pd.read_csv(TRAIN_PATH)

print("Loading test data...")
test = pd.read_csv(TEST_PATH)

# -----------------------------
# Prepare features
# -----------------------------

X_train = train.drop(
    columns=["isFraud"] + REMOVE_FEATURES
)
y_train = train["isFraud"]

X_test = test.drop(
    columns=["isFraud"] + REMOVE_FEATURES
)
y_test = test["isFraud"]

print("\nTRAIN:", X_train.shape)
print("TEST :", X_test.shape)

print("\nTrain fraud:", y_train.sum())
print("Test fraud :", y_test.sum())

# -----------------------------
# Class imbalance
# -----------------------------

scale_pos_weight = (
    (y_train == 0).sum() /
    (y_train == 1).sum()
)

print("\nscale_pos_weight:", scale_pos_weight)

# -----------------------------
# Train final model
# -----------------------------

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

print("\nTraining final model...")

model.fit(
    X_train,
    y_train,
    verbose=False
)

print("Training complete.")

# -----------------------------
# Test predictions
# -----------------------------

print("\nEvaluating untouched test set...")

test_prob = model.predict_proba(X_test)[:, 1]

test_pred = (
    test_prob >= THRESHOLD
).astype(int)

# -----------------------------
# Metrics
# -----------------------------

precision = precision_score(
    y_test,
    test_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    test_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    test_pred,
    zero_division=0
)

pr_auc = average_precision_score(
    y_test,
    test_prob
)

roc_auc = roc_auc_score(
    y_test,
    test_prob
)

tn, fp, fn, tp = confusion_matrix(
    y_test,
    test_pred
).ravel()

fpr = fp / (fp + tn)

fraud_detection_rate = tp / (tp + fn)

# -----------------------------
# Results
# -----------------------------

print("\n================================")
print("     SENTINEL FINAL TEST")
print("================================")

print(f"Threshold          : {THRESHOLD}")
print(f"Precision          : {precision:.4f}")
print(f"Recall             : {recall:.4f}")
print(f"F1                 : {f1:.4f}")
print(f"PR-AUC             : {pr_auc:.4f}")
print(f"ROC-AUC            : {roc_auc:.4f}")
print(f"False Positive Rate: {fpr:.6f}")
print(f"Fraud Detection    : {fraud_detection_rate:.4f}")

print("\n===== CONFUSION MATRIX =====")

print(
    f"TN: {tn:,}"
)
print(
    f"FP: {fp:,}"
)
print(
    f"FN: {fn:,}"
)
print(
    f"TP: {tp:,}"
)

print("\nMatrix:")
print(confusion_matrix(y_test, test_pred))

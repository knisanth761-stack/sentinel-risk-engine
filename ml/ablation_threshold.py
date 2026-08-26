import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

TRAIN_PATH = "data/processed/train.csv"
VAL_PATH = "data/processed/validation.csv"

train = pd.read_csv(TRAIN_PATH)
val = pd.read_csv(VAL_PATH)

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

print("Training ablation model...")
model.fit(
    X_train,
    y_train,
    eval_set=[(X_val, y_val)],
    verbose=False
)

val_prob = model.predict_proba(X_val)[:, 1]

print("\n===== THRESHOLD ANALYSIS =====")
print(
    f"{'Threshold':<12}"
    f"{'Precision':<12}"
    f"{'Recall':<12}"
    f"{'F1':<12}"
    f"{'FPR':<12}"
)

results = []

for threshold in [
    0.10, 0.20, 0.30, 0.40, 0.50,
    0.60, 0.70, 0.80, 0.90, 0.95, 0.99
]:

    pred = (val_prob >= threshold).astype(int)

    precision = precision_score(
        y_val, pred, zero_division=0
    )

    recall = recall_score(
        y_val, pred, zero_division=0
    )

    f1 = f1_score(
        y_val, pred, zero_division=0
    )

    tn, fp, fn, tp = confusion_matrix(
        y_val, pred
    ).ravel()

    fpr = fp / (fp + tn)

    results.append(
        (threshold, precision, recall, f1, fpr)
    )

    print(
        f"{threshold:<12.2f}"
        f"{precision:<12.4f}"
        f"{recall:<12.4f}"
        f"{f1:<12.4f}"
        f"{fpr:<12.6f}"
    )

# Best F1
best = max(results, key=lambda x: x[3])

print("\n===== BEST F1 THRESHOLD =====")
print(f"Threshold : {best[0]:.2f}")
print(f"Precision : {best[1]:.4f}")
print(f"Recall    : {best[2]:.4f}")
print(f"F1        : {best[3]:.4f}")
print(f"FPR       : {best[4]:.6f}")

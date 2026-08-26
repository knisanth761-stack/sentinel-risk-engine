import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    average_precision_score,
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

print("Training baseline model...")

model = LogisticRegression(
    class_weight="balanced",
    max_iter=1000,
    solver="liblinear"
)

model.fit(X_train, y_train)

print("Generating validation probabilities...")

val_prob = model.predict_proba(X_val)[:, 1]

print("\n===== PR-AUC =====")
print(f"{average_precision_score(y_val, val_prob):.4f}")

print("\n===== THRESHOLD ANALYSIS =====")
print(
    f"{'Threshold':<10}"
    f"{'Precision':<12}"
    f"{'Recall':<12}"
    f"{'F1':<12}"
    f"{'FPR':<12}"
)

best_f1 = 0
best_threshold = None

for threshold in [
    0.10,
    0.20,
    0.30,
    0.40,
    0.50,
    0.60,
    0.70,
    0.80,
    0.90,
]:
    val_pred = (val_prob >= threshold).astype(int)

    precision = precision_score(
        y_val,
        val_pred,
        zero_division=0
    )

    recall = recall_score(
        y_val,
        val_pred,
        zero_division=0
    )

    f1 = f1_score(
        y_val,
        val_pred,
        zero_division=0
    )

    tn, fp, fn, tp = confusion_matrix(
        y_val,
        val_pred
    ).ravel()

    fpr = fp / (fp + tn)

    print(
        f"{threshold:<10.2f}"
        f"{precision:<12.4f}"
        f"{recall:<12.4f}"
        f"{f1:<12.4f}"
        f"{fpr:<12.6f}"
    )

    if f1 > best_f1:
        best_f1 = f1
        best_threshold = threshold

print("\n===== BEST F1 THRESHOLD =====")
print(f"Threshold: {best_threshold}")
print(f"F1:        {best_f1:.4f}")

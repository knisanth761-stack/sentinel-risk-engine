import pandas as pd
import xgboost as xgb

TEST_PATH = "data/processed/test.csv"

REMOVE_FEATURES = [
    "balance_change_orig",
    "balance_change_dest",
    "orig_balance_error",
    "dest_balance_error"
]

THRESHOLD = 0.99

print("Loading test data...")
test = pd.read_csv(TEST_PATH)

X_test = test.drop(
    columns=["isFraud"] + REMOVE_FEATURES
)

y_test = test["isFraud"]

# Recreate the same model configuration
train = pd.read_csv("data/processed/train.csv")

X_train = train.drop(
    columns=["isFraud"] + REMOVE_FEATURES
)

y_train = train["isFraud"]

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

print("Training model...")
model.fit(X_train, y_train, verbose=False)

probabilities = model.predict_proba(X_test)[:, 1]

predictions = (
    probabilities >= THRESHOLD
).astype(int)

test = test.copy()
test["prediction"] = predictions

# -----------------------------
# Business categories
# -----------------------------

true_fraud = test[test["isFraud"] == 1]

detected_fraud = test[
    (test["isFraud"] == 1) &
    (test["prediction"] == 1)
]

missed_fraud = test[
    (test["isFraud"] == 1) &
    (test["prediction"] == 0)
]

false_positives = test[
    (test["isFraud"] == 0) &
    (test["prediction"] == 1)
]

legitimate = test[test["isFraud"] == 0]

# -----------------------------
# Amount impact
# -----------------------------

total_fraud_amount = true_fraud["amount"].sum()
detected_fraud_amount = detected_fraud["amount"].sum()
missed_fraud_amount = missed_fraud["amount"].sum()
false_positive_amount = false_positives["amount"].sum()
legitimate_amount = legitimate["amount"].sum()

fraud_prevention_rate = (
    detected_fraud_amount / total_fraud_amount
    if total_fraud_amount > 0 else 0
)

fraud_loss_rate = (
    missed_fraud_amount / total_fraud_amount
    if total_fraud_amount > 0 else 0
)

false_positive_rate = (
    len(false_positives) / len(legitimate)
)

print("\n==============================================")
print("        SENTINEL BUSINESS IMPACT")
print("==============================================")

print(f"Threshold                    : {THRESHOLD}")

print("\nTRANSACTION COUNTS")
print("----------------------------------------------")
print(f"Total transactions           : {len(test):,}")
print(f"Actual fraud                 : {len(true_fraud):,}")
print(f"Fraud detected               : {len(detected_fraud):,}")
print(f"Fraud missed                 : {len(missed_fraud):,}")
print(f"False positives              : {len(false_positives):,}")
print(f"Legitimate transactions      : {len(legitimate):,}")

print("\nAMOUNT IMPACT")
print("----------------------------------------------")
print(f"Total fraud exposure         : ₹{total_fraud_amount:,.2f}")
print(f"Fraud amount detected        : ₹{detected_fraud_amount:,.2f}")
print(f"Fraud amount missed          : ₹{missed_fraud_amount:,.2f}")
print(f"Legitimate amount flagged    : ₹{false_positive_amount:,.2f}")

print("\nBUSINESS RATES")
print("----------------------------------------------")
print(
    f"Fraud amount prevention rate : "
    f"{fraud_prevention_rate:.4%}"
)

print(
    f"Fraud amount leakage rate    : "
    f"{fraud_loss_rate:.4%}"
)

print(
    f"Legitimate FP rate           : "
    f"{false_positive_rate:.4%}"
)

print("\n==============================================")
print("INTERPRETATION")
print("==============================================")

print(
    f"Sentinel detected "
    f"{len(detected_fraud):,} of "
    f"{len(true_fraud):,} fraudulent transactions."
)

print(
    f"₹{detected_fraud_amount:,.2f} of the "
    f"₹{total_fraud_amount:,.2f} fraud exposure "
    f"was detected."
)

print(
    f"₹{missed_fraud_amount:,.2f} of fraud exposure "
    f"was missed."
)

print(
    f"{len(false_positives):,} legitimate transactions "
    f"were incorrectly flagged."
)

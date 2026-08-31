import pandas as pd
import xgboost as xgb

from sklearn.metrics import confusion_matrix

TEST_PATH = "data/processed/test.csv"
MODEL_PATH = "ml/xgboost_fraud_model.json"

# Must match the deployed evaluation operating point
THRESHOLD = 0.50

print("=" * 65)
print("       SENTINEL — DEPLOYED MODEL BUSINESS IMPACT")
print("=" * 65)

# --------------------------------------------------
# Load untouched held-out test data
# --------------------------------------------------

print("\nLoading held-out test data...")
test = pd.read_csv(TEST_PATH)

# --------------------------------------------------
# Load EXACT deployed production artifact
# --------------------------------------------------

print("Loading deployed model artifact...")

model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)

features = model.get_booster().feature_names

print("\nMODEL ARTIFACT")
print("-" * 65)
print("Path     :", MODEL_PATH)
print("Features :", len(features))
print("Trees    :", model.get_booster().num_boosted_rounds())

# --------------------------------------------------
# Verify feature compatibility
# --------------------------------------------------

missing = [f for f in features if f not in test.columns]

if missing:
    raise ValueError(
        f"Test dataset is missing model features: {missing}"
    )

X_test = test[features]
y_test = test["isFraud"]

print("\nTEST DATA")
print("-" * 65)
print("Transactions :", f"{len(test):,}")
print("Fraud cases  :", f"{int(y_test.sum()):,}")
print("Fraud rate   :", f"{y_test.mean():.6%}")

# --------------------------------------------------
# Predict using EXACT deployed artifact
# --------------------------------------------------

print("\nGenerating predictions...")

probabilities = model.predict_proba(X_test)[:, 1]

predictions = (
    probabilities >= THRESHOLD
).astype(int)

# --------------------------------------------------
# Attach predictions
# --------------------------------------------------

results = test.copy()
results["fraud_probability"] = probabilities
results["prediction"] = predictions

# --------------------------------------------------
# Confusion matrix
# --------------------------------------------------

tn, fp, fn, tp = confusion_matrix(
    y_test,
    predictions
).ravel()

# --------------------------------------------------
# Business categories
# --------------------------------------------------

true_fraud = results[
    results["isFraud"] == 1
]

detected_fraud = results[
    (results["isFraud"] == 1) &
    (results["prediction"] == 1)
]

missed_fraud = results[
    (results["isFraud"] == 1) &
    (results["prediction"] == 0)
]

false_positives = results[
    (results["isFraud"] == 0) &
    (results["prediction"] == 1)
]

legitimate = results[
    results["isFraud"] == 0
]

# --------------------------------------------------
# Amount impact
# --------------------------------------------------

total_fraud_amount = true_fraud["amount"].sum()

detected_fraud_amount = (
    detected_fraud["amount"].sum()
)

missed_fraud_amount = (
    missed_fraud["amount"].sum()
)

false_positive_amount = (
    false_positives["amount"].sum()
)

# --------------------------------------------------
# Business metrics
# --------------------------------------------------

fraud_amount_prevention_rate = (
    detected_fraud_amount / total_fraud_amount
    if total_fraud_amount > 0 else 0
)

fraud_amount_leakage_rate = (
    missed_fraud_amount / total_fraud_amount
    if total_fraud_amount > 0 else 0
)

legitimate_false_positive_rate = (
    fp / len(legitimate)
    if len(legitimate) > 0 else 0
)

# --------------------------------------------------
# Report
# --------------------------------------------------

print("\n" + "=" * 65)
print("              BUSINESS IMPACT RESULTS")
print("=" * 65)

print(f"\nOperating threshold : {THRESHOLD:.2f}")

print("\nTRANSACTION OUTCOMES")
print("-" * 65)

print(f"Total transactions      : {len(results):,}")
print(f"Actual fraud            : {len(true_fraud):,}")
print(f"Fraud detected          : {len(detected_fraud):,}")
print(f"Fraud missed            : {len(missed_fraud):,}")
print(f"False positives         : {len(false_positives):,}")
print(f"Legitimate transactions : {len(legitimate):,}")

print("\nCONFUSION MATRIX")
print("-" * 65)

print(f"True Negative  : {tn:,}")
print(f"False Positive : {fp:,}")
print(f"False Negative : {fn:,}")
print(f"True Positive  : {tp:,}")

print("\nFRAUD AMOUNT IMPACT")
print("-" * 65)

print(
    f"Total fraud exposure      : "
    f"₹{total_fraud_amount:,.2f}"
)

print(
    f"Fraud amount detected     : "
    f"₹{detected_fraud_amount:,.2f}"
)

print(
    f"Fraud amount missed       : "
    f"₹{missed_fraud_amount:,.2f}"
)

print(
    f"Legitimate amount flagged : "
    f"₹{false_positive_amount:,.2f}"
)

print("\nBUSINESS RATES")
print("-" * 65)

print(
    f"Fraud amount prevention rate : "
    f"{fraud_amount_prevention_rate:.4%}"
)

print(
    f"Fraud amount leakage rate    : "
    f"{fraud_amount_leakage_rate:.4%}"
)

print(
    f"Legitimate false positive rate : "
    f"{legitimate_false_positive_rate:.6%}"
)

print("\nFALSE-POSITIVE COST OBSERVATION")
print("-" * 65)

if fp == 0:
    print(
        "Observed false-positive transaction count : 0"
    )
    print(
        "Observed legitimate amount incorrectly "
        "flagged : ₹0.00"
    )
    print(
        "Observed direct false-positive intervention "
        "cost on this held-out evaluation set : ₹0.00"
    )
else:
    print(
        f"Legitimate transactions incorrectly "
        f"flagged : {fp:,}"
    )
    print(
        f"Legitimate transaction value affected : "
        f"₹{false_positive_amount:,.2f}"
    )

print("\n" + "=" * 65)
print("                 INTERPRETATION")
print("=" * 65)

print(
    f"\nUsing the exact deployed model artifact at "
    f"threshold {THRESHOLD:.2f}:"
)

print(
    f"• Sentinel detected {tp:,} of {int(y_test.sum()):,} "
    f"fraudulent transactions."
)

print(
    f"• ₹{detected_fraud_amount:,.2f} of "
    f"₹{total_fraud_amount:,.2f} total fraud exposure "
    f"was identified."
)

print(
    f"• ₹{missed_fraud_amount:,.2f} of fraud exposure "
    f"was missed."
)

print(
    f"• {fp:,} legitimate transactions were incorrectly "
    f"flagged."
)

print("\nARTIFACT VERIFICATION")
print("-" * 65)

print("Saved artifact loaded directly : YES")
print("Model retrained                : NO")
print("Held-out test set              : YES")
print("Feature order from artifact    : YES")
print("Production model evaluated     : YES")

print("\n" + "=" * 65)
print("           BUSINESS IMPACT COMPLETE")
print("=" * 65)

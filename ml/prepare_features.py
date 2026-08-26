import pandas as pd

DATA_PATH = "data/paysim.csv"

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)

# Sort chronologically
df = df.sort_values("step").reset_index(drop=True)

# -----------------------------
# Feature engineering
# -----------------------------

# Originator balance change
df["balance_change_orig"] = (
    df["oldbalanceOrg"] - df["newbalanceOrig"]
)

# Destination balance change
df["balance_change_dest"] = (
    df["newbalanceDest"] - df["oldbalanceDest"]
)

# Amount relative to originator's previous balance
df["amount_to_oldbalance_orig"] = (
    df["amount"] / (df["oldbalanceOrg"] + 1)
)

# Amount relative to destination's previous balance
df["amount_to_oldbalance_dest"] = (
    df["amount"] / (df["oldbalanceDest"] + 1)
)

# Difference between expected and actual origin balance
df["orig_balance_error"] = (
    df["oldbalanceOrg"] - df["amount"] - df["newbalanceOrig"]
)

# Difference between expected and actual destination balance
df["dest_balance_error"] = (
    df["oldbalanceDest"] + df["amount"] - df["newbalanceDest"]
)

# -----------------------------
# Remove identifiers / target
# -----------------------------

drop_columns = [
    "nameOrig",
    "nameDest",
    "isFraud",
    "isFlaggedFraud"
]

X = df.drop(columns=drop_columns)
y = df["isFraud"]

# One-hot encode transaction type
X = pd.get_dummies(
    X,
    columns=["type"],
    dtype=int
)

# -----------------------------
# Temporal split
# -----------------------------

split_step = int(df["step"].max() * 0.8)

train_mask = df["step"] <= split_step
test_mask = df["step"] > split_step

X_train = X[train_mask]
y_train = y[train_mask]

X_test = X[test_mask]
y_test = y[test_mask]

print("\n===== FEATURE SET =====")
print(X.columns.tolist())

print("\n===== TRAIN =====")
print("Shape:", X_train.shape)
print("Fraud:", y_train.sum())
print("Fraud rate:", round(y_train.mean() * 100, 4), "%")

print("\n===== TEST =====")
print("Shape:", X_test.shape)
print("Fraud:", y_test.sum())
print("Fraud rate:", round(y_test.mean() * 100, 4), "%")

print("\n===== FEATURES CREATED =====")
print(
    "balance_change_orig",
    "balance_change_dest",
    "amount_to_oldbalance_orig",
    "amount_to_oldbalance_dest",
    "orig_balance_error",
    "dest_balance_error",
)

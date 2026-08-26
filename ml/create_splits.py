import pandas as pd
from pathlib import Path

DATA_PATH = "data/paysim.csv"
OUTPUT_DIR = Path("data/processed")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading PaySim...")
df = pd.read_csv(DATA_PATH)

# Sort chronologically
df = df.sort_values("step").reset_index(drop=True)

# -----------------------------
# Feature engineering
# -----------------------------

df["balance_change_orig"] = (
    df["oldbalanceOrg"] - df["newbalanceOrig"]
)

df["balance_change_dest"] = (
    df["newbalanceDest"] - df["oldbalanceDest"]
)

df["amount_to_oldbalance_orig"] = (
    df["amount"] / (df["oldbalanceOrg"] + 1)
)

df["amount_to_oldbalance_dest"] = (
    df["amount"] / (df["oldbalanceDest"] + 1)
)

df["orig_balance_error"] = (
    df["oldbalanceOrg"] - df["amount"] - df["newbalanceOrig"]
)

df["dest_balance_error"] = (
    df["oldbalanceDest"] + df["amount"] - df["newbalanceDest"]
)

# -----------------------------
# Remove identifiers / leakage
# -----------------------------

drop_columns = [
    "nameOrig",
    "nameDest",
    "isFlaggedFraud"
]

df = df.drop(columns=drop_columns)

# Encode transaction type
df = pd.get_dummies(
    df,
    columns=["type"],
    dtype=int
)

# -----------------------------
# Temporal split
# -----------------------------

train = df[df["step"] <= 520]
validation = df[
    (df["step"] > 520) &
    (df["step"] <= 594)
]
test = df[df["step"] > 594]

# -----------------------------
# Save
# -----------------------------

train.to_csv(OUTPUT_DIR / "train.csv", index=False)
validation.to_csv(OUTPUT_DIR / "validation.csv", index=False)
test.to_csv(OUTPUT_DIR / "test.csv", index=False)

print("\n===== SPLITS =====")

for name, data in [
    ("TRAIN", train),
    ("VALIDATION", validation),
    ("TEST", test)
]:
    print(
        f"{name}: {data.shape} | "
        f"Fraud: {data['isFraud'].sum()} | "
        f"Fraud rate: {data['isFraud'].mean() * 100:.4f}%"
    )

print("\nSaved to:")
print(OUTPUT_DIR)

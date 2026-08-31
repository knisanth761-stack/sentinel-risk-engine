// Centralized display-label mapping for raw deployed-model feature
// identifiers. Display layer only — the raw identifier is never
// changed internally (still used for React keys, tooltips, and any
// data handling); only what's shown to the user is humanized here.
//
// Covers all 17 features in the deployed XGBoost artifact
// (ml/xgboost_fraud_model.json). Reused by:
//   - components/intelligence/ShapPanel.jsx (Top ML Contributors)
//   - components/model/FeatureImportanceBar.jsx (Global Feature Importance)
//   - pages/CommandCenter.jsx (Top Risk Signals)
export const FEATURE_LABELS = {
  step: "Transaction Time Step",
  amount: "Transaction Amount",
  oldbalanceOrg: "Previous Origin Balance",
  newbalanceOrig: "New Origin Balance",
  oldbalanceDest: "Previous Destination Balance",
  newbalanceDest: "New Destination Balance",
  balance_change_orig: "Origin Balance Change",
  balance_change_dest: "Destination Balance Change",
  amount_to_oldbalance_orig: "Amount-to-Origin Balance Ratio",
  amount_to_oldbalance_dest: "Amount-to-Destination Balance Ratio",
  orig_balance_error: "Origin Balance Mismatch",
  dest_balance_error: "Destination Balance Mismatch",
  type_CASH_IN: "Cash-In Transaction",
  type_CASH_OUT: "Cash-Out Transaction",
  type_DEBIT: "Debit Transaction",
  type_PAYMENT: "Payment Transaction",
  type_TRANSFER: "Transfer Transaction",
};

/**
 * Returns the human-readable display label for a raw feature
 * identifier. Falls back to the raw identifier itself for any key not
 * in the map (e.g. an explanation "reason" string that isn't a feature
 * name at all) so callers never break on unmapped input.
 */
export function humanizeFeature(feature) {
  return FEATURE_LABELS[feature] || feature;
}

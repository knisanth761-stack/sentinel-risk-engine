import { AlertTriangle, ChevronRight, Fingerprint, RefreshCw, Zap } from "lucide-react";
import PresetRow from "./PresetRow";

export default function TransactionForm({
  transaction,
  updateField,
  applyPreset,
  onAnalyze,
  loading,
  error,
}) {
  return (
    <div className="panel transaction-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">01 / INSPECT</span>
          <h2>Transaction Input</h2>
        </div>
        <Fingerprint size={20} />
      </div>

      <PresetRow onApply={applyPreset} />

      <div className="form-grid">
        <label>
          Transaction ID
          <input value={transaction.transactionId} onChange={(e) => updateField("transactionId", e.target.value)} />
        </label>

        <label>
          User ID
          <input value={transaction.userId} onChange={(e) => updateField("userId", e.target.value)} />
        </label>

        <label>
          Amount
          <input type="number" value={transaction.amount} onChange={(e) => updateField("amount", e.target.value)} />
        </label>

        <label>
          Currency
          <input value={transaction.currency} onChange={(e) => updateField("currency", e.target.value)} />
        </label>

        <label>
          Transaction Type
          <select value={transaction.type} onChange={(e) => updateField("type", e.target.value)}>
            <option>PAYMENT</option>
            <option>TRANSFER</option>
            <option>CASH_OUT</option>
            <option>CASH_IN</option>
            <option>DEBIT</option>
          </select>
        </label>

        <label>
          Step
          <input type="number" value={transaction.step} onChange={(e) => updateField("step", e.target.value)} />
        </label>

        <label>
          Source Balance
          <input
            type="number"
            value={transaction.oldbalanceOrg}
            onChange={(e) => updateField("oldbalanceOrg", e.target.value)}
          />
        </label>

        <label>
          Source After
          <input
            type="number"
            value={transaction.newbalanceOrig}
            onChange={(e) => updateField("newbalanceOrig", e.target.value)}
          />
        </label>

        <label>
          Destination Balance
          <input
            type="number"
            value={transaction.oldbalanceDest}
            onChange={(e) => updateField("oldbalanceDest", e.target.value)}
          />
        </label>

        <label>
          Destination After
          <input
            type="number"
            value={transaction.newbalanceDest}
            onChange={(e) => updateField("newbalanceDest", e.target.value)}
          />
        </label>
      </div>

      <button className="analyze-button" onClick={onAnalyze} disabled={loading}>
        {loading ? (
          <>
            <RefreshCw size={17} className="spin" />
            ANALYZING TRANSACTION
          </>
        ) : (
          <>
            <Zap size={17} />
            RUN SENTINEL ANALYSIS
            <ChevronRight size={17} />
          </>
        )}
      </button>

      {error && (
        <div className="error-box">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

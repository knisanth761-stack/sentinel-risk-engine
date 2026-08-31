import { AlertTriangle, CheckCircle2, Scale } from "lucide-react";
import ProvenanceTag from "../shared/ProvenanceTag";
import { balanceConsistency } from "../../lib/risk";
import { formatINR, formatSigned } from "../../lib/format";

export default function BalanceConsistencyPanel({ transaction }) {
  const check = balanceConsistency(transaction);

  return (
    <div className="panel balance-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">06 / LEDGER</span>
          <h2>Balance Consistency</h2>
        </div>
        <ProvenanceTag kind="derived" />
      </div>

      <div className="balance-rows">
        <div className="balance-row">
          <span>
            {check.originConsistent ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            Source delta vs amount
          </span>
          <strong className={check.originConsistent ? "ok" : "flag"}>
            {formatSigned(check.originDelta - check.amount, 2)}
          </strong>
        </div>
        <div className="balance-row">
          <span>
            {check.destConsistent ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            Destination delta vs amount
          </span>
          <strong className={check.destConsistent ? "ok" : "flag"}>
            {formatSigned(check.destDelta - check.amount, 2)}
          </strong>
        </div>
      </div>

      <div className={`balance-verdict ${check.fullyConsistent ? "ok" : "flag"}`}>
        <Scale size={15} />
        {check.fullyConsistent
          ? "Ledger movement matches the stated amount on both sides."
          : "Ledger movement does not fully reconcile with the stated amount — worth a closer look."}
      </div>

      <p className="balance-hint">
        Source {formatINR(transaction.oldbalanceOrg)} → {formatINR(transaction.newbalanceOrig)} · Destination{" "}
        {formatINR(transaction.oldbalanceDest)} → {formatINR(transaction.newbalanceDest)}
      </p>
    </div>
  );
}

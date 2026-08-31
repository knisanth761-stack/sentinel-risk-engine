import { ArrowRight, CircleUserRound, Landmark } from "lucide-react";
import { formatINR } from "../../lib/format";

export default function FlowDiagram({ transaction }) {
  return (
    <div className="panel flow-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">07 / FLOW</span>
          <h2>Origin → Destination</h2>
        </div>
      </div>

      <div className="flow-diagram">
        <div className="flow-node">
          <CircleUserRound size={22} />
          <strong>{transaction.userId}</strong>
          <span>{formatINR(transaction.oldbalanceOrg)}</span>
          <small>→ {formatINR(transaction.newbalanceOrig)}</small>
        </div>

        <div className="flow-arrow">
          <ArrowRight size={20} />
          <span>{formatINR(transaction.amount)}</span>
          <small>{transaction.type}</small>
        </div>

        <div className="flow-node">
          <Landmark size={22} />
          <strong>Destination account</strong>
          <span>{formatINR(transaction.oldbalanceDest)}</span>
          <small>→ {formatINR(transaction.newbalanceDest)}</small>
        </div>
      </div>
    </div>
  );
}

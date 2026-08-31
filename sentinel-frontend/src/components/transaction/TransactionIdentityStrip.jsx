import { CircleUserRound, Hash, Tag, Wallet } from "lucide-react";
import { formatINR } from "../../lib/format";

// Shows the transaction currently loaded into the form, before or after
// analysis. Every value here is the same `transaction` state already
// used by TransactionForm/FlowDiagram/MetadataPanel — this is a
// presentational summary only, no new data source.
export default function TransactionIdentityStrip({ transaction }) {
  return (
    <div className="identity-strip">
      <div className="identity-chip">
        <Hash size={13} />
        <div>
          <span>TRANSACTION</span>
          <strong>{transaction.transactionId}</strong>
        </div>
      </div>

      <div className="identity-chip">
        <CircleUserRound size={13} />
        <div>
          <span>USER</span>
          <strong>{transaction.userId}</strong>
        </div>
      </div>

      <div className="identity-chip">
        <Tag size={13} />
        <div>
          <span>TYPE</span>
          <strong>{transaction.type}</strong>
        </div>
      </div>

      <div className="identity-chip">
        <Wallet size={13} />
        <div>
          <span>AMOUNT</span>
          <strong>{formatINR(transaction.amount)}</strong>
        </div>
      </div>
    </div>
  );
}

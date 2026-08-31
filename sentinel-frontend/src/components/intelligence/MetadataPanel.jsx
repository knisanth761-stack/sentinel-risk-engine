import { Banknote, CircleUserRound, Clock3, Hash, Layers, Tag } from "lucide-react";

const FIELDS = (transaction, result) => [
  { icon: Hash, label: "Transaction ID", value: transaction.transactionId },
  { icon: CircleUserRound, label: "User ID", value: transaction.userId },
  { icon: Tag, label: "Type", value: transaction.type },
  { icon: Layers, label: "Step", value: transaction.step },
  // Display-only: the product is presented in an Indian/INR context.
  // transaction.currency itself is untouched and still whatever value
  // the form field holds when the transaction is submitted — this only
  // overrides what's shown in this one metadata row.
  { icon: Banknote, label: "Currency", value: "INR" },
  { icon: Clock3, label: "Engine status", value: result ? "Analyzed" : "Pending" },
];

export default function MetadataPanel({ transaction, result }) {
  return (
    <div className="panel metadata-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">08 / METADATA</span>
          <h2>Transaction Metadata</h2>
        </div>
        <Tag size={18} />
      </div>

      <div className="metadata-grid">
        {FIELDS(transaction, result).map(({ icon: FieldIcon, label, value }) => (
          <div key={label}>
            <span>
              <FieldIcon size={11} />
              {label}
            </span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

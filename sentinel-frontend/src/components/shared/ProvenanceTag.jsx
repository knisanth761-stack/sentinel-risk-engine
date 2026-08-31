const LABELS = {
  live: "LIVE ENGINE",
  derived: "DERIVED",
  pending: "PENDING BACKEND",
};

export default function ProvenanceTag({ kind = "live" }) {
  return <span className={`provenance-tag provenance-${kind}`}>{LABELS[kind] || LABELS.live}</span>;
}

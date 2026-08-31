export default function EmptyState({ icon, title, message, spec }) {
  return (
    <div className="empty-state">
      {icon}
      <strong>{title}</strong>
      <span>{message}</span>
      {spec && (
        <div className="empty-state-spec">
          <span className="empty-state-spec-label">REQUIRES</span>
          <code>{spec}</code>
        </div>
      )}
    </div>
  );
}

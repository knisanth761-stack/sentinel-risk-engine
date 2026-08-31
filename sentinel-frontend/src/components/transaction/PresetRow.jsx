export default function PresetRow({ onApply }) {
  return (
    <div className="preset-row">
      <button onClick={() => onApply("normal")}>NORMAL</button>
      <button onClick={() => onApply("suspicious")}>SUSPICIOUS</button>
      <button onClick={() => onApply("fraud")}>FRAUD TEST</button>
    </div>
  );
}

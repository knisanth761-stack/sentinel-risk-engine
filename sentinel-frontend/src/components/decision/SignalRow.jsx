import { formatPercent } from "../../lib/format";

export default function SignalRow({ ruleScore, mlProbability }) {
  const ruleValue = Number(ruleScore ?? 0);
  const mlValue = Number(mlProbability ?? 0) * 100;

  return (
    <div className="signal-row">
      <div>
        <span>RULE ENGINE</span>
        <strong>{ruleValue.toFixed(0)} / 100</strong>
        <div className="signal-bar">
          <span style={{ width: `${Math.min(100, Math.max(0, ruleValue))}%` }} />
        </div>
      </div>
      <div>
        <span>ML FRAUD PROBABILITY</span>
        <strong>{formatPercent(mlProbability)}</strong>
        <div className="signal-bar ml">
          <span style={{ width: `${Math.min(100, Math.max(0, mlValue))}%` }} />
        </div>
      </div>
    </div>
  );
}

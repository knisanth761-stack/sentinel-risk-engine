import { riskTier } from "../../lib/risk";

export default function RiskTierBadge({ score }) {
  const tier = riskTier(score);
  const isCritical = tier.label === "CRITICAL";

  return (
    <span className={`tier-badge tier-${tier.tone}${isCritical ? " tier-critical" : ""}`}>{tier.label}</span>
  );
}

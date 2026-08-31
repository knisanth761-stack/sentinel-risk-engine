import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../shared/EmptyState";
import { PieChart } from "lucide-react";

const TIER_COLORS = {
  LOW: "#63a985",
  MODERATE: "#c9ae64",
  HIGH: "#c8787e",
  CRITICAL: "#b15d62",
};

// Mirrors the tone assignment already established in lib/risk.js's tier
// definitions (LOW→safe, MODERATE→warning, HIGH/CRITICAL→danger) so the
// tooltip's badge reuses the same visual language as the rest of the app.
// This chart only receives pre-aggregated counts per label, not raw
// scores, so it can't call riskTier() itself — this local map is a
// presentational mirror, not a second classification.
const TIER_TONE = {
  LOW: "safe",
  MODERATE: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
};

function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { tier, count } = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <span className={`tier-badge tier-${TIER_TONE[tier] || "danger"}`}>{tier}</span>
      <div className="chart-tooltip-row">
        <strong>{count}</strong>
        <span className="chart-tooltip-label">{count === 1 ? "transaction" : "transactions"}</span>
      </div>
    </div>
  );
}

export default function RiskDistributionChart({ distribution, total }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!total) {
    return (
      <EmptyState
        icon={<PieChart size={30} />}
        title="No distribution yet"
        message="Risk tier distribution appears as you analyze transactions."
      />
    );
  }

  const data = Object.entries(distribution).map(([tier, count]) => ({ tier, count }));

  return (
    <div
      className="chart-frame"
      role="img"
      aria-label={`Risk tier distribution across ${total} analyzed transactions this session`}
    >
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <defs>
            {data.map((entry) => (
              <linearGradient key={entry.tier} id={`bar-${entry.tier}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TIER_COLORS[entry.tier]} stopOpacity={0.95} />
                <stop offset="100%" stopColor={TIER_COLORS[entry.tier]} stopOpacity={0.55} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="2 6" stroke="#171e26" vertical={false} />
          <XAxis
            dataKey="tier"
            tick={{ fill: "#5c6675", fontSize: 9, fontFamily: '"DM Mono", monospace' }}
            axisLine={{ stroke: "#1a2129" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#5c6675", fontSize: 9, fontFamily: '"DM Mono", monospace' }}
            axisLine={false}
            tickLine={false}
            width={26}
          />
          <Tooltip content={<DistributionTooltip />} cursor={{ fill: "rgba(255,255,255,0.025)" }} />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            animationDuration={600}
            animationEasing="ease-out"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.tier}
                fill={`url(#bar-${entry.tier})`}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                style={{ transition: "opacity .25s ease" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

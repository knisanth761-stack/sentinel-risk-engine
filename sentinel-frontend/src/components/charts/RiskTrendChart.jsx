import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "../shared/EmptyState";
import { Activity } from "lucide-react";
import { riskTier } from "../../lib/risk";

// Mirrors the exact tier cut points already defined in lib/risk.js
// (LOW ≤24, MODERATE ≤49, HIGH ≤74, CRITICAL ≤100). Used only to paint
// static reference bands behind the real trend line — not a new
// calculation, and not exported/duplicated as app logic anywhere else.
const TIER_BANDS = [
  { from: 0, to: 24, tone: "safe" },
  { from: 24, to: 49, tone: "warning" },
  { from: 49, to: 74, tone: "danger" },
  { from: 74, to: 100, tone: "danger" },
];

const BAND_FILL = {
  safe: "rgba(101,193,138,.05)",
  warning: "rgba(196,168,90,.05)",
  danger: "rgba(193,108,114,.05)",
};

const DOT_COLOR = {
  safe: "#63a985",
  warning: "#c9ae64",
  danger: "#c8787e",
};

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const tier = riskTier(point.score);

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-id">{point.label}</span>
      <div className="chart-tooltip-row">
        <strong>{point.score.toFixed(0)}</strong>
        <span className={`tier-badge tier-${tier.tone}`}>{tier.label}</span>
      </div>
    </div>
  );
}

function TrendDot(props) {
  const { cx, cy, payload, index, dataLength } = props;
  if (cx == null || cy == null) return null;

  const tier = riskTier(payload.score);
  const color = DOT_COLOR[tier.tone] || DOT_COLOR.danger;
  const isLast = index === dataLength - 1;

  return (
    <g>
      {isLast && (
        <circle cx={cx} cy={cy} r={7} fill={color} opacity={0.22} className="chart-live-pulse" />
      )}
      <circle cx={cx} cy={cy} r={isLast ? 4 : 2.5} fill={color} stroke="#0b0e13" strokeWidth={1.4} />
    </g>
  );
}

export default function RiskTrendChart({ history }) {
  if (!history.length) {
    return (
      <EmptyState
        icon={<Activity size={30} />}
        title="No session activity yet"
        message="Risk-over-time appears as you analyze transactions."
      />
    );
  }

  const data = [...history]
    .reverse()
    .map((entry, index) => ({
      index: index + 1,
      score: Number(entry.score.toFixed(1)),
      label: entry.transaction.transactionId,
    }));

  return (
    <div
      className="chart-frame"
      role="img"
      aria-label={`Risk score trend across ${data.length} analyzed transactions this session`}
    >
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7ea9cf" stopOpacity={0.38} />
              <stop offset="95%" stopColor="#7ea9cf" stopOpacity={0} />
            </linearGradient>
          </defs>

          {TIER_BANDS.map((band) => (
            <ReferenceArea
              key={band.from}
              y1={band.from}
              y2={band.to}
              fill={BAND_FILL[band.tone]}
              strokeWidth={0}
              ifOverflow="hidden"
            />
          ))}

          <CartesianGrid strokeDasharray="2 6" stroke="#171e26" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fill: "#5c6675", fontSize: 9, fontFamily: '"DM Mono", monospace' }}
            axisLine={{ stroke: "#1a2129" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#5c6675", fontSize: 9, fontFamily: '"DM Mono", monospace' }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#2a3947", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#7ea9cf"
            strokeWidth={2}
            fill="url(#riskFill)"
            dot={(dotProps) => <TrendDot key={dotProps.index} {...dotProps} dataLength={data.length} />}
            activeDot={false}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

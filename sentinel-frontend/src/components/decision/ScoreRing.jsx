import { useEffect, useRef, useState } from "react";
import { riskTier } from "../../lib/risk";

// Self-contained SVG radial gauge. Visualizes the existing `score` prop
// only — no new risk calculation. Tier coloring reuses riskTier() from
// lib/risk.js exactly as already used elsewhere in the app (read-only
// import, lib/risk.js itself is untouched).

const SIZE = 132;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TIER_COLORS = {
  safe: { stroke: "#63a985", glow: "rgba(101,193,138,.4)", text: "#77bd96" },
  warning: { stroke: "#c9ae64", glow: "rgba(196,168,90,.38)", text: "#c9ae64" },
  danger: { stroke: "#c8787e", glow: "rgba(193,108,114,.42)", text: "#c8787e" },
};

export default function ScoreRing({ score }) {
  const tier = riskTier(score);
  const colors = TIER_COLORS[tier.tone] || TIER_COLORS.danger;

  // Same visible number as before — no rounding/clamping change to the
  // displayed value. Clamping below is only to keep the SVG arc geometry
  // sane (e.g. if score were ever negative or >100), never shown to the user.
  const displayScore = score.toFixed(0);
  const clampedPercent = Math.min(100, Math.max(0, Number(score) || 0));
  const offset = CIRCUMFERENCE * (1 - clampedPercent / 100);

  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [justUpdated, setJustUpdated] = useState(false);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReducedMotion(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  useEffect(() => {
    if (prevScoreRef.current === score) return undefined;
    prevScoreRef.current = score;
    setJustUpdated(true);
    const timeout = setTimeout(() => setJustUpdated(false), 650);
    return () => clearTimeout(timeout);
  }, [score]);

  const arcTransition = reducedMotion
    ? "none"
    : "stroke-dashoffset .9s cubic-bezier(.16,1,.3,1), stroke .5s ease";

  return (
    <div
      className={`sentinel-gauge${justUpdated ? " gauge-pulse" : ""}`}
      role="img"
      aria-label={`Risk score ${displayScore} out of 100, risk tier ${tier.label}`}
    >
      <style>{`
        .sentinel-gauge {
          position: relative;
          width: ${SIZE}px;
          height: ${SIZE}px;
          flex: none;
          display: grid;
          place-items: center;
        }

        .sentinel-gauge svg {
          transform: rotate(-90deg);
          overflow: visible;
        }

        .sentinel-gauge .gauge-progress {
          transition: ${arcTransition};
        }

        .sentinel-gauge.gauge-pulse svg {
          animation: ${reducedMotion ? "none" : "sentinelGaugePulse .6s cubic-bezier(.16,1,.3,1)"};
        }

        @keyframes sentinelGaugePulse {
          0% { transform: rotate(-90deg) scale(.95); }
          55% { transform: rotate(-90deg) scale(1.035); }
          100% { transform: rotate(-90deg) scale(1); }
        }

        .sentinel-gauge .gauge-label {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          text-align: center;
          pointer-events: none;
        }

        .sentinel-gauge .gauge-label strong {
          display: block;
          font-family: "Space Grotesk", Inter, system-ui, sans-serif;
          font-weight: 600;
          font-size: 31px;
          letter-spacing: -.03em;
          transition: ${reducedMotion ? "none" : "color .5s ease"};
        }

        .sentinel-gauge .gauge-label span {
          display: block;
          margin-top: 2px;
          color: #667180;
          font: 9px "DM Mono", monospace;
          letter-spacing: .05em;
        }
      `}</style>

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#1b222b" strokeWidth={STROKE} />
        <circle
          className="gauge-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 7px ${colors.glow})` }}
        />
      </svg>

      <div className="gauge-label" aria-hidden="true">
        <strong style={{ color: colors.text }}>{displayScore}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

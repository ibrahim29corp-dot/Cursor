import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton, bebas } from "../fonts";
import { formatStatValue } from "../lib/format";
import { fitFontSize, slamSpring } from "../lib/motion";
import type { Stat } from "../types";

type StatCardProps = {
  stat: Stat;
  index: number;
  accent: string;
  text: string;
  muted: string;
  card: string;
};

export const StatCard = ({ stat, index, accent, text, muted, card }: StatCardProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const enter = spring({
    frame: frame - index * 2,
    fps,
    config: slamSpring,
  });
  const x = interpolate(enter, [0, 1], [index % 2 === 0 ? -46 : 46, 0]);
  const opacity = interpolate(enter, [0, 0.22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const countStart = 3 + index * 2;
  const progress = interpolate(frame, [countStart, countStart + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const numericValue = stat.value !== null && Number.isFinite(stat.value) ? stat.value : null;
  const display =
    numericValue === null ? stat.placeholder : formatStatValue(numericValue * progress, numericValue, stat.suffix);
  const sidePadding = portrait ? 64 + 80 + 56 : 88 * 2;
  const columns = portrait ? 1 : 3;
  const inner = (width - sidePadding) / columns - 36;
  const valueSize = fitFontSize(
    display,
    Math.max(inner, 120),
    numericValue === null ? (portrait ? 52 : 36) : portrait ? 96 : 72,
  );
  const bar = numericValue !== null
    ? progress
    : spring({
        frame: frame - 2 - index * 2,
        fps,
        config: { damping: 16, stiffness: 260, mass: 0.3, overshootClamping: true },
      });

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        opacity,
        transform: `translateX(${x}px)`,
        background: card,
        border: `2px solid ${accent}`,
        padding: portrait ? "28px 28px 36px" : "24px 22px 32px",
        boxShadow: `0 0 28px rgba(83,252,24,0.12)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: accent,
          transform: `scaleY(${interpolate(enter, [0, 1], [0, 1])})`,
          transformOrigin: "top center",
          boxShadow: `0 0 16px ${accent}`,
        }}
      />
      <div
        style={{
          fontFamily: anton,
          fontSize: portrait ? 28 : 22,
          color: accent,
          opacity: 0.45,
          letterSpacing: 1,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: bebas,
          fontSize: portrait ? 32 : 26,
          letterSpacing: 3,
          color: muted,
        }}
      >
        {stat.label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: anton,
          fontSize: valueSize,
          lineHeight: 0.9,
          color: numericValue === null ? accent : text,
          fontVariantNumeric: "tabular-nums",
          textShadow: numericValue === null ? `0 0 18px ${accent}` : "none",
        }}
      >
        {display}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background: "rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(1, bar)) * 100}%`,
            height: "100%",
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
      </div>
    </div>
  );
};

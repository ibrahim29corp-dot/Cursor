import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SafeZone } from "../types";

type CornerBracketsProps = {
  safeZone: SafeZone;
  color: string;
};

export const CornerBrackets = ({ safeZone, color }: CornerBracketsProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 280, mass: 0.32, overshootClamping: true },
  });
  const scale = interpolate(enter, [0, 1], [0, 1]);
  const arm = 36;
  const thickness = 4;
  const gap = 8;
  const corners = [
    {
      top: Math.max(6, safeZone.top - gap - arm),
      left: Math.max(6, safeZone.left - gap - arm),
      origin: "left top",
    },
    {
      top: Math.max(6, safeZone.top - gap - arm),
      left: Math.min(width - arm - 6, width - safeZone.right + gap),
      origin: "right top",
    },
    {
      top: Math.min(height - arm - 6, height - safeZone.bottom + gap),
      left: Math.max(6, safeZone.left - gap - arm),
      origin: "left bottom",
    },
    {
      top: Math.min(height - arm - 6, height - safeZone.bottom + gap),
      left: Math.min(width - arm - 6, width - safeZone.right + gap),
      origin: "right bottom",
    },
  ];

  return (
    <>
      {corners.map((corner) => (
        <div
          key={`${corner.top}-${corner.left}`}
          style={{
            position: "absolute",
            top: corner.top,
            left: corner.left,
            width: arm,
            height: arm,
            transform: `scale(${scale})`,
            transformOrigin: corner.origin,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: corner.origin.includes("bottom") ? undefined : 0,
              bottom: corner.origin.includes("bottom") ? 0 : undefined,
              left: 0,
              right: 0,
              height: thickness,
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: corner.origin.includes("right") ? undefined : 0,
              right: corner.origin.includes("right") ? 0 : undefined,
              width: thickness,
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
        </div>
      ))}
    </>
  );
};

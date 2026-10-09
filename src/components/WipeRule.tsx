import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { settleSpring } from "../lib/motion";

type WipeRuleProps = {
  color: string;
  delay?: number;
  height?: number;
};

export const WipeRule = ({ color, delay = 0, height = 10 }: WipeRuleProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: settleSpring,
  });
  const scale = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        height,
        width: "100%",
        transform: `scaleX(${scale})`,
        transformOrigin: "left center",
        background: color,
        boxShadow: `0 0 18px ${color}`,
      }}
    />
  );
};

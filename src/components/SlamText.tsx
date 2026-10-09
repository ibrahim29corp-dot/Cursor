import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { slamSpring } from "../lib/motion";
import { useEnergy } from "./energy";

type SlamTextProps = {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  accent: string;
  delay?: number;
  stagger?: number;
  mode?: "words" | "chars";
  align?: "left" | "center";
  origin?: "center" | "bottom";
  letterSpacing?: number;
  lineHeight?: number;
  uppercase?: boolean;
};

export const SlamText = ({
  text,
  fontFamily,
  fontSize,
  color,
  accent,
  delay = 0,
  stagger = 2,
  mode = "words",
  align = "left",
  origin = "center",
  letterSpacing = 0,
  lineHeight = 0.9,
  uppercase = true,
}: SlamTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const energy = useEnergy();
  const lines = text.split("\n");
  const justify = align === "center" ? "center" : "flex-start";
  const glitch = energy > 0.08 ? energy : 0;

  return (
    <div style={{ width: "100%", textAlign: align }}>
      {lines.map((line, lineIndex) => {
        const tokens = mode === "chars" ? line.split("") : line.split(" ").filter(Boolean);
        return (
          <div
            key={`${line}-${lineIndex}`}
            style={{
              display: "flex",
              flexWrap: mode === "chars" ? "nowrap" : "wrap",
              justifyContent: justify,
              columnGap: mode === "chars" ? fontSize * 0.02 : fontSize * 0.2,
              marginTop: lineIndex === 0 ? 0 : fontSize * -0.06,
              lineHeight,
            }}
          >
            {tokens.map((token, tokenIndex) => {
              const order = lineIndex * 4 + tokenIndex;
              const enter = spring({
                frame: frame - delay - order * stagger,
                fps,
                config: slamSpring,
              });
              const y = interpolate(enter, [0, 1], [origin === "bottom" ? 14 : 36, 0]);
              const scale = interpolate(enter, [0, 1], [1.16, 1]);
              const opacity = interpolate(enter, [0, 0.28], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const tilt = mode === "chars" ? interpolate(enter, [0, 1], [8, 0]) : 0;
              const shown = uppercase ? token.toUpperCase() : token;
              const baseShadow =
                color === accent
                  ? `0 0 18px ${accent}, 0 8px 24px rgba(0,0,0,0.85)`
                  : "0 8px 24px rgba(0,0,0,0.85)";
              const textShadow =
                glitch > 0
                  ? `${(glitch * 5).toFixed(2)}px 0 ${accent}, ${(glitch * -4).toFixed(2)}px 0 rgba(255,255,255,0.9), ${baseShadow}`
                  : baseShadow;
              return (
                <span
                  key={`${token}-${tokenIndex}`}
                  style={{
                    display: "inline-block",
                    fontFamily,
                    fontSize,
                    color,
                    letterSpacing,
                    opacity,
                    transform: `translateY(${y}px) scale(${scale}) rotate(${tilt}deg)`,
                    transformOrigin: origin === "bottom" ? "center bottom" : "center center",
                    textShadow,
                    whiteSpace: "pre",
                  }}
                >
                  {shown === " " ? "\u00A0" : shown}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

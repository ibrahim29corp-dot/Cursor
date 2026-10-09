import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { withAlpha } from "../lib/color";
import type { Brand } from "../types";
import { useEnergy } from "./energy";

type BackdropProps = {
  brand: Brand;
};

export const Backdrop = ({ brand }: BackdropProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const energy = useEnergy();
  const glowTop = interpolate(frame, [0, durationInFrames * 0.35, durationInFrames * 0.7, durationInFrames], [16, 38, 24, 46], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stripe = interpolate(frame % 120, [0, 120], [0, -48]);
  const scan = interpolate(frame % 80, [0, 80], [-8, 108]);
  const glow = interpolate(energy, [0, 1], [0.2, 0.48]);

  return (
    <AbsoluteFill style={{ background: brand.background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "-15%",
          width: "130%",
          height: "62%",
          top: `${glowTop}%`,
          background: `radial-gradient(ellipse at center, ${withAlpha(brand.accent, glow)} 0%, ${withAlpha(brand.accent, 0)} 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -80,
          backgroundImage: `repeating-linear-gradient(-18deg, transparent, transparent 22px, ${withAlpha(brand.accent, 0.045)} 22px, ${withAlpha(brand.accent, 0.045)} 23px)`,
          transform: `translateY(${stripe}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${scan}%`,
          height: 2,
          background: brand.accent,
          opacity: 0.16,
          boxShadow: `0 0 16px ${brand.accent}`,
        }}
      />
    </AbsoluteFill>
  );
};

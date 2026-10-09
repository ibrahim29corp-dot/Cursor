import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton } from "../fonts";
import { withAlpha } from "../lib/color";
import { fitFontSize, settleSpring } from "../lib/motion";
import type { Brand, Layout, SafeZone } from "../types";
import { AssetImage } from "./AssetImage";
import { SafeContent } from "./SafeContent";
import { SlamText } from "./SlamText";
import { WipeRule } from "./WipeRule";
import { useEnergy } from "./energy";

export type HookSceneProps = {
  layout: Layout;
  hook: string;
  cutoutSrc: string;
  safeZone: SafeZone;
  brand: Brand;
};

export const HookScene = ({ layout, hook, cutoutSrc, safeZone, brand }: HookSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const energy = useEnergy();
  const portrait = layout === "portrait";
  const zoom = spring({ frame, fps, config: settleSpring });
  const scale = interpolate(zoom, [0, 1], [1.58, 1]);
  const rotate = interpolate(zoom, [0, 1], [portrait ? -4 : -2.5, 0]);
  const ring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 70, mass: 0.75 },
  });
  const ringScale = interpolate(ring, [0, 1], [0.7, 1.4]);
  const ringOpacity = interpolate(ring, [0, 1], [0.65, 0]);
  const available = width - safeZone.left - safeZone.right;
  const textWidth = portrait ? available : available * 0.5;
  const fontSize = fitFontSize(hook, textWidth, portrait ? 108 : 80, 0.7);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: portrait ? 10 : -30,
            left: portrait ? "50%" : "-2%",
            width: portrait ? width * 0.94 : width * 0.62,
            height: portrait ? height * 0.8 : height * 1.12,
            transform: portrait
              ? `translateX(-50%) scale(${scale}) rotate(${rotate}deg)`
              : `scale(${scale}) rotate(${rotate}deg)`,
            transformOrigin: portrait ? "50% 40%" : "28% 55%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "10% 8%",
              background: `radial-gradient(circle, ${withAlpha(brand.accent, 0.45)} 0%, ${withAlpha(brand.accent, 0)} 68%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "6%",
              borderRadius: "50%",
              border: `3px solid ${brand.accent}`,
              opacity: ringOpacity,
              transform: `scale(${ringScale})`,
              boxShadow: `0 0 24px ${brand.accent}`,
            }}
          />
          <AssetImage
            src={cutoutSrc}
            fallbackLabel="CUTOUT"
            accent={brand.accent}
            text={brand.text}
            style={{
              filter: `drop-shadow(0 18px 30px rgba(0,0,0,0.55)) drop-shadow(${energy * 12}px 0 0 ${withAlpha(brand.accent, 0.85)})`,
            }}
          />
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: portrait
            ? `linear-gradient(to top, ${brand.background} 0%, ${withAlpha(brand.background, 0.94)} 16%, ${withAlpha(brand.background, 0.62)} 32%, ${withAlpha(brand.background, 0)} 52%)`
            : `linear-gradient(to right, ${withAlpha(brand.background, 0)} 0%, ${withAlpha(brand.background, 0.15)} 30%, ${withAlpha(brand.background, 0.9)} 56%, ${brand.background} 100%)`,
        }}
      />
      <SafeContent
        safeZone={safeZone}
        style={{ justifyContent: portrait ? "flex-end" : "center" }}
      >
        <div style={{ width: portrait ? "100%" : "48%", marginLeft: portrait ? 0 : "auto" }}>
          <WipeRule color={brand.accent} delay={1} height={portrait ? 12 : 8} />
          <div style={{ height: 16 }} />
          <SlamText
            text={hook}
            fontFamily={anton}
            fontSize={fontSize}
            color={brand.text}
            accent={brand.accent}
            delay={1}
            stagger={1}
            align="left"
            origin="bottom"
            lineHeight={0.88}
          />
        </div>
      </SafeContent>
    </AbsoluteFill>
  );
};

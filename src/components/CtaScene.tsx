import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton } from "../fonts";
import { withAlpha } from "../lib/color";
import { fitFontSize, slamSpring } from "../lib/motion";
import type { Brand, Layout, SafeZone } from "../types";
import { AssetImage } from "./AssetImage";
import { SafeContent } from "./SafeContent";
import { SlamText } from "./SlamText";
import { useEnergy } from "./energy";

export type CtaSceneProps = {
  layout: Layout;
  headline: string;
  url: string;
  button: string;
  logoSrc: string;
  safeZone: SafeZone;
  brand: Brand;
};

const PulseRing = ({
  frame,
  offset,
  accent,
}: {
  frame: number;
  offset: number;
  accent: string;
}) => {
  const progress = ((frame + offset) % 24) / 24;
  const scale = interpolate(progress, [0, 1], [0.94, 1.42]);
  const opacity = interpolate(progress, [0, 0.18, 1], [0, 0.55, 0]);
  return (
    <div
      style={{
        position: "absolute",
        inset: -8,
        borderRadius: 999,
        border: `3px solid ${accent}`,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 0 18px ${accent}`,
      }}
    />
  );
};

export const CtaScene = ({
  layout,
  headline,
  url,
  button,
  logoSrc,
  safeZone,
  brand,
}: CtaSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const energy = useEnergy();
  const portrait = layout === "portrait";
  const available = width - safeZone.left - safeZone.right;
  const logoSize = portrait ? 188 : 210;
  const textWidth = portrait ? available : available - logoSize - 72;
  const headlineSize = fitFontSize(headline, textWidth, portrait ? 104 : 86);
  const urlSize = fitFontSize(url, textWidth, portrait ? 58 : 46, 0.58);
  const logoIn = spring({ frame, fps, config: slamSpring });
  const logoScale = interpolate(logoIn, [0, 1], [0.55, 1]);
  const logoTilt = interpolate(logoIn, [0, 1], [-10, 0]);
  const buttonIn = spring({
    frame: frame - 4,
    fps,
    config: slamSpring,
  });
  const buttonInScale = interpolate(buttonIn, [0, 1], [0.82, 1]);
  const buttonOpacity = interpolate(buttonIn, [0, 0.35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = interpolate(Math.sin((frame / fps) * Math.PI * 4.2), [-1, 1], [1, 1.08]);
  const glow = interpolate(Math.sin((frame / fps) * Math.PI * 4.2), [-1, 1], [16, 52]);
  const buttonScale = buttonInScale * pulse * (1 + energy * 0.07);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: portrait ? "86%" : "48%",
            height: portrait ? 420 : 320,
            background: `radial-gradient(ellipse at center, ${withAlpha(brand.accent, 0.28)} 0%, ${withAlpha(brand.accent, 0)} 70%)`,
          }}
        />
      </AbsoluteFill>
      <SafeContent safeZone={safeZone} style={{ justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            flexDirection: portrait ? "column" : "row",
            justifyContent: "center",
            gap: portrait ? 28 : 64,
          }}
        >
          <div
            style={{
              width: logoSize,
              height: logoSize,
              flexShrink: 0,
              transform: `scale(${logoScale}) rotate(${logoTilt}deg)`,
            }}
          >
            <AssetImage
              src={logoSrc}
              fallbackLabel="LOGO"
              accent={brand.accent}
              text={brand.text}
            />
          </div>
          <div style={{ width: portrait ? "100%" : "auto", maxWidth: textWidth }}>
            <SlamText
              text={headline}
              fontFamily={anton}
              fontSize={headlineSize}
              color={brand.text}
              accent={brand.accent}
              align={portrait ? "center" : "left"}
              delay={0}
              stagger={1}
              origin="center"
              lineHeight={0.88}
            />
            <div style={{ height: 16 }} />
            <SlamText
              text={url}
              fontFamily={anton}
              fontSize={urlSize}
              color={brand.accent}
              accent={brand.accent}
              align={portrait ? "center" : "left"}
              delay={3}
              uppercase={false}
              letterSpacing={0.5}
            />
            <div
              style={{
                position: "relative",
                marginTop: 28,
                width: portrait ? "100%" : "fit-content",
                opacity: buttonOpacity,
              }}
            >
              <PulseRing frame={frame} offset={0} accent={brand.accent} />
              <PulseRing frame={frame} offset={12} accent={brand.accent} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  minWidth: portrait ? "100%" : 420,
                  padding: portrait ? "26px 36px" : "22px 42px",
                  borderRadius: 999,
                  background: brand.accent,
                  color: brand.background,
                  transform: `scale(${buttonScale})`,
                  boxShadow: `0 0 ${glow}px ${brand.accent}`,
                }}
              >
                <span
                  style={{
                    fontFamily: anton,
                    fontSize: portrait ? 54 : 44,
                    letterSpacing: 1.5,
                    lineHeight: 0.9,
                  }}
                >
                  {button}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SafeContent>
    </AbsoluteFill>
  );
};

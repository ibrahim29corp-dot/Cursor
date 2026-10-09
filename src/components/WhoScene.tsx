import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton, bebas } from "../fonts";
import { withAlpha } from "../lib/color";
import { fitFontSize, slamSpring } from "../lib/motion";
import type { Brand, Layout, SafeZone } from "../types";
import { AssetImage } from "./AssetImage";
import { SafeContent } from "./SafeContent";
import { SlamText } from "./SlamText";
import { WipeRule } from "./WipeRule";

export type WhoSceneProps = {
  layout: Layout;
  name: string;
  role: string;
  tagline: string;
  cutoutSrc: string;
  safeZone: SafeZone;
  brand: Brand;
};

export const WhoScene = ({ layout, name, role, tagline, cutoutSrc, safeZone, brand }: WhoSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const portrait = layout === "portrait";
  const available = width - safeZone.left - safeZone.right;
  const nameWidth = portrait ? available * 0.96 : available * 0.52;
  const nameSize = fitFontSize(name, nameWidth, portrait ? 214 : 168);
  const roleSize = fitFontSize(role || "ROLE", nameWidth, portrait ? 40 : 32, 0.7);
  const longestWord = (tagline || "LIVE")
    .split(/\s+/)
    .reduce((longest, word) => (word.length > longest.length ? word : longest), "LIVE");
  const tagSize = Math.min(portrait ? 48 : 40, fitFontSize(longestWord, available, 72));
  const ruleWidth = Math.min(nameWidth, Math.max(name.length, 1) * nameSize * 0.58);
  const glow = spring({
    frame: frame - 2,
    fps,
    config: { damping: 16, stiffness: 240, mass: 0.3, overshootClamping: true },
  });
  const figure = spring({ frame, fps, config: slamSpring });
  const figureScale = interpolate(figure, [0, 1], [1.18, 1]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: portrait ? 90 : "-6%",
            left: portrait ? "8%" : "-2%",
            width: portrait ? "84%" : "50%",
            height: portrait ? "70%" : "116%",
            transform: `scale(${figureScale})`,
            transformOrigin: portrait ? "50% 22%" : "32% 40%",
          }}
        >
          <AssetImage
            src={cutoutSrc}
            fallbackLabel="CUTOUT"
            accent={brand.accent}
            text={brand.text}
          />
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: portrait
            ? `linear-gradient(to bottom, ${withAlpha(brand.background, 0.08)} 0%, ${withAlpha(brand.background, 0.12)} 36%, ${withAlpha(brand.background, 0.9)} 54%, ${brand.background} 70%)`
            : `linear-gradient(to right, ${withAlpha(brand.background, 0.12)} 0%, ${withAlpha(brand.background, 0.35)} 34%, ${withAlpha(brand.background, 0.94)} 52%, ${brand.background} 100%)`,
        }}
      />
      <SafeContent safeZone={safeZone} style={{ justifyContent: portrait ? "flex-end" : "center" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            width: portrait ? "100%" : "52%",
            marginLeft: portrait ? 0 : "auto",
            flexDirection: "column",
            alignItems: portrait ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: portrait ? "50%" : "18%",
              top: "42%",
              width: portrait ? "130%" : "160%",
              height: portrait ? 320 : 240,
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(ellipse at center, ${withAlpha(brand.accent, 0.4 * glow)} 0%, ${withAlpha(brand.accent, 0)} 70%)`,
              filter: "blur(8px)",
              pointerEvents: "none",
            }}
          />
          {role ? (
            <SlamText
              text={role}
              fontFamily={bebas}
              fontSize={roleSize}
              color={brand.accent}
              accent={brand.accent}
              letterSpacing={4}
              delay={0}
              stagger={1}
              align={portrait ? "center" : "left"}
            />
          ) : null}
          <div style={{ height: portrait ? 18 : 12 }} />
          <SlamText
            text={name}
            fontFamily={anton}
            fontSize={nameSize}
            color={brand.text}
            accent={brand.accent}
            mode="chars"
            align={portrait ? "center" : "left"}
            delay={1}
            stagger={1}
            letterSpacing={-1}
          />
          <div style={{ width: ruleWidth, marginTop: 10 }}>
            <WipeRule color={brand.accent} delay={6} height={portrait ? 14 : 10} />
          </div>
          {tagline ? (
            <>
              <div style={{ height: portrait ? 18 : 12 }} />
              <SlamText
                text={tagline}
                fontFamily={anton}
                fontSize={tagSize}
                color={brand.muted}
                accent={brand.accent}
                align={portrait ? "center" : "left"}
                delay={7}
                stagger={1}
              />
            </>
          ) : null}
        </div>
      </SafeContent>
    </AbsoluteFill>
  );
};

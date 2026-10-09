import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton, bebas } from "../fonts";
import { withAlpha } from "../lib/color";
import { fitFontSize } from "../lib/motion";
import type { Brand, Layout, SafeZone } from "../types";
import { SafeContent } from "./SafeContent";
import { SlamText } from "./SlamText";
import { WipeRule } from "./WipeRule";

export type WhoSceneProps = {
  layout: Layout;
  name: string;
  role: string;
  tagline: string;
  safeZone: SafeZone;
  brand: Brand;
};

export const WhoScene = ({ layout, name, role, tagline, safeZone, brand }: WhoSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const portrait = layout === "portrait";
  const available = width - safeZone.left - safeZone.right;
  const nameSize = fitFontSize(name, available * 0.96, portrait ? 214 : 200);
  const roleSize = fitFontSize(role || "ROLE", available, portrait ? 40 : 32, 0.7);
  const longestWord = (tagline || "LIVE")
    .split(/\s+/)
    .reduce((longest, word) => (word.length > longest.length ? word : longest), "LIVE");
  const tagSize = Math.min(portrait ? 48 : 40, fitFontSize(longestWord, available, 72));
  const ruleWidth = Math.min(available, Math.max(name.length, 1) * nameSize * 0.58);
  const glow = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: portrait ? "78%" : "46%",
            height: portrait ? 280 : 220,
            background: `radial-gradient(ellipse at center, ${withAlpha(brand.accent, 0.42 * glow)} 0%, ${withAlpha(brand.accent, 0)} 70%)`,
            filter: "blur(8px)",
          }}
        />
      </AbsoluteFill>
      <SafeContent safeZone={safeZone} style={{ justifyContent: "center" }}>
        <div style={{ display: "flex", width: "100%", flexDirection: "column", alignItems: "center" }}>
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
              align="center"
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
            align="center"
            delay={3}
            stagger={2}
            letterSpacing={-1}
          />
          <div style={{ width: ruleWidth, marginTop: 14 }}>
            <WipeRule color={brand.accent} delay={14} height={portrait ? 14 : 10} />
          </div>
          {tagline ? (
            <>
              <div style={{ height: portrait ? 26 : 18 }} />
              <SlamText
                text={tagline}
                fontFamily={anton}
                fontSize={tagSize}
                color={brand.muted}
                accent={brand.accent}
                align="center"
                delay={16}
                stagger={2}
              />
            </>
          ) : null}
        </div>
      </SafeContent>
    </AbsoluteFill>
  );
};

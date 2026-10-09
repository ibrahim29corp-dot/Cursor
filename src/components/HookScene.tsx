import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton } from "../fonts";
import { withAlpha } from "../lib/color";
import { fitFontSize, settleSpring } from "../lib/motion";
import type { Brand, Layout, SafeZone } from "../types";
import { PhotoFlash } from "./PhotoFlash";
import { SafeContent } from "./SafeContent";
import { SlamText } from "./SlamText";
import { WipeRule } from "./WipeRule";
export type HookSceneProps = {
  layout: Layout;
  hook: string;
  name: string;
  role: string;
  photos: readonly string[];
  holdFrames: number;
  safeZone: SafeZone;
  brand: Brand;
};

export const HookScene = ({ layout, hook, name, role, photos, holdFrames, safeZone, brand }: HookSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const portrait = layout === "portrait";
  const zoom = spring({ frame, fps, config: settleSpring });
  const scale = interpolate(zoom, [0, 1], [1.08, 1]);
  const available = width - safeZone.left - safeZone.right;
  const textWidth = portrait ? available : available * 0.5;
  const fontSize = fitFontSize(hook, textWidth, portrait ? 78 : 58, 0.7);
  const nameSize = fitFontSize(name, textWidth, portrait ? 132 : 96);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden", transform: `scale(${scale})` }}>
        <PhotoFlash photos={photos} holdFrames={holdFrames} offset={0} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: portrait
            ? `linear-gradient(to top, ${brand.background} 0%, ${brand.background} 18%, ${withAlpha(brand.background, 0.92)} 30%, ${withAlpha(brand.background, 0.4)} 46%, ${withAlpha(brand.background, 0)} 62%)`
            : `linear-gradient(to right, ${withAlpha(brand.background, 0.15)} 0%, ${withAlpha(brand.background, 0.2)} 28%, ${withAlpha(brand.background, 0.94)} 52%, ${brand.background} 100%)`,
        }}
      />
      <SafeContent
        safeZone={safeZone}
        style={{ justifyContent: portrait ? "flex-end" : "center" }}
      >
        <div style={{ width: portrait ? "100%" : "48%", marginLeft: portrait ? 0 : "auto" }}>
          {role ? (
            <SlamText
              text={role}
              fontFamily={anton}
              fontSize={portrait ? 28 : 22}
              color={brand.accent}
              accent={brand.accent}
              delay={0}
              stagger={1}
              align="left"
              letterSpacing={2}
            />
          ) : null}
          <SlamText
            text={name}
            fontFamily={anton}
            fontSize={nameSize}
            color={brand.text}
            accent={brand.accent}
            delay={0}
            stagger={1}
            align="left"
            origin="bottom"
            lineHeight={0.86}
          />
          <div style={{ height: 10 }} />
          <WipeRule color={brand.accent} delay={1} height={portrait ? 12 : 8} />
          <div style={{ height: 12 }} />
          <SlamText
            text={hook}
            fontFamily={anton}
            fontSize={fontSize}
            color={brand.text}
            accent={brand.accent}
            delay={0}
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

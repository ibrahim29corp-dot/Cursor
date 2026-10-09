import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton } from "../fonts";
import { withAlpha } from "../lib/color";
import { slamSpring } from "../lib/motion";
import type { Brand, Clip, Layout, SafeZone } from "../types";
import { MediaFallback } from "./MediaFallback";
import { PhotoFlash } from "./PhotoFlash";
import { SafeContent } from "./SafeContent";

export type ClipsSceneProps = {
  layout: Layout;
  clips: Clip[];
  photos: readonly string[];
  holdFrames: number;
  safeZone: SafeZone;
  brand: Brand;
};

export const ClipsScene = ({
  layout,
  clips,
  photos,
  holdFrames,
  safeZone,
  brand,
}: ClipsSceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const portrait = layout === "portrait";
  const captions = clips.map((clip) => clip.caption).filter(Boolean);

  if (photos.length === 0) {
    return (
      <SafeContent safeZone={safeZone} style={{ justifyContent: "center" }}>
        <MediaFallback label="PHOTOS" path="config.photos" accent={brand.accent} text={brand.text} />
      </SafeContent>
    );
  }

  const captionEvery = Math.max(6, holdFrames * 2);
  const captionIndex = captions.length === 0 ? 0 : Math.floor(frame / captionEvery) % captions.length;
  const caption = captions[captionIndex] ?? "";
  const local = frame % captionEvery;
  const pop = spring({ frame: local, fps, config: slamSpring });
  const captionY = interpolate(pop, [0, 1], [22, 0]);
  const captionOpacity = interpolate(pop, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PhotoFlash photos={photos} holdFrames={Math.max(2, holdFrames - 1)} offset={9} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${brand.background} 0%, ${withAlpha(brand.background, 0.78)} 16%, ${withAlpha(brand.background, 0)} 38%)`,
        }}
      />
      <SafeContent safeZone={safeZone} style={{ justifyContent: "flex-end", zIndex: 30 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "center",
            gap: 14,
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
            background: withAlpha(brand.background, 0.82),
            borderLeft: `8px solid ${brand.accent}`,
            padding: portrait ? "16px 28px" : "12px 22px",
            boxShadow: `0 0 24px ${withAlpha(brand.accent, 0.28)}`,
          }}
        >
          <div
            style={{
              fontFamily: anton,
              fontSize: portrait ? 58 : 42,
              color: brand.text,
              letterSpacing: 1,
              lineHeight: 0.9,
            }}
          >
            {caption}
          </div>
        </div>
      </SafeContent>
    </AbsoluteFill>
  );
};

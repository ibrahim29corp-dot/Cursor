import { AbsoluteFill } from "remotion";
import { withAlpha } from "../lib/color";
import type { Brand, Layout, SafeZone, Stat } from "../types";
import { PhotoFlash } from "./PhotoFlash";
import { SafeContent } from "./SafeContent";
import { StatCard } from "./StatCard";

export type ProofSceneProps = {
  layout: Layout;
  stats: Stat[];
  photos: readonly string[];
  holdFrames: number;
  safeZone: SafeZone;
  brand: Brand;
};

export const ProofScene = ({ layout, stats, photos, holdFrames, safeZone, brand }: ProofSceneProps) => {
  const portrait = layout === "portrait";

  return (
    <AbsoluteFill>
      <PhotoFlash photos={photos} holdFrames={holdFrames} offset={2} />
      <AbsoluteFill style={{ background: withAlpha(brand.background, 0.42) }} />
      <SafeContent safeZone={safeZone} style={{ zIndex: 2 }}>
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          width: "100%",
          flexDirection: portrait ? "column" : "row",
          gap: portrait ? 22 : 18,
        }}
      >
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={index}
            accent={brand.accent}
            text={brand.text}
            muted={brand.muted}
            card={brand.card}
          />
        ))}
      </div>
    </SafeContent>
    </AbsoluteFill>
  );
};

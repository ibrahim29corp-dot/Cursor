import { AbsoluteFill, Img } from "remotion";
import { hasStaticFile, publicSrc } from "../lib/assets";
import { withAlpha } from "../lib/color";
import type { Brand, Layout, SafeZone, Stat } from "../types";
import { SafeContent } from "./SafeContent";
import { StatCard } from "./StatCard";

export type ProofSceneProps = {
  layout: Layout;
  stats: Stat[];
  stillSrc: string;
  safeZone: SafeZone;
  brand: Brand;
};

export const ProofScene = ({ layout, stats, stillSrc, safeZone, brand }: ProofSceneProps) => {
  const portrait = layout === "portrait";

  return (
    <AbsoluteFill>
      {hasStaticFile(stillSrc) ? (
        <Img
          src={publicSrc(stillSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 18%",
          }}
        />
      ) : null}
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

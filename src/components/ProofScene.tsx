import type { Brand, Layout, SafeZone, Stat } from "../types";
import { SafeContent } from "./SafeContent";
import { StatCard } from "./StatCard";

export type ProofSceneProps = {
  layout: Layout;
  stats: Stat[];
  safeZone: SafeZone;
  brand: Brand;
};

export const ProofScene = ({ layout, stats, safeZone, brand }: ProofSceneProps) => {
  const portrait = layout === "portrait";

  return (
    <SafeContent safeZone={safeZone}>
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
  );
};

import { AbsoluteFill, useCurrentFrame } from "remotion";

export const FilmGrain = () => {
  const frame = useCurrentFrame();
  const seed = frame % 4;
  const id = `film-grain-${seed}`;
  const driftX = (frame * 3) % 24;
  const driftY = (frame * 5) % 18;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.22, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%" style={{ position: "absolute" }}>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={1}
            seed={seed}
            stitchTiles="stitch"
          />
          <feOffset dx={driftX} dy={driftY} result="shifted" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

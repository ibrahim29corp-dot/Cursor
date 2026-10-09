import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioLayer } from "./components/AudioLayer";
import { Backdrop } from "./components/Backdrop";
import { CornerBrackets } from "./components/CornerBrackets";
import { CtaScene } from "./components/CtaScene";
import { FilmGrain } from "./components/FilmGrain";
import { HookScene } from "./components/HookScene";
import { ProofScene } from "./components/ProofScene";
import { SceneFade } from "./components/SceneFade";
import { EnergyContext } from "./components/energy";
import { promoConfig } from "./config";
import { beatIntensity, toFrames } from "./lib/motion";
import type { Layout } from "./types";

export type SneakoPromoProps = {
  layout: Layout;
};

export const SneakoPromo = ({ layout }: SneakoPromoProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { brand, safeZone, scenes } = promoConfig;
  const zone = safeZone[layout];
  const hit = beatIntensity(frame, fps, promoConfig.beatTimes);
  const step = frame % 4;
  const xDir = interpolate(step, [0, 1, 2, 3], [1, -0.85, 0.65, -1]);
  const yDir = interpolate(step, [0, 1, 2, 3], [-0.4, 1, -0.75, 0.45]);
  const hookFrames = toFrames(scenes.hook.duration, fps);
  const proofFrames = toFrames(scenes.proof.duration, fps);
  const ctaFrames = toFrames(scenes.cta.duration, fps);

  return (
    <EnergyContext.Provider value={hit}>
      <AbsoluteFill style={{ background: brand.background, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `translate(${hit * 5 * xDir}px, ${hit * 3 * yDir}px)` }}>
          <Backdrop brand={brand} />
          <Sequence from={toFrames(scenes.hook.from, fps)} durationInFrames={hookFrames}>
            <SceneFade durationInFrames={hookFrames} enterFrames={0} exitFrames={0}>
              <HookScene
                layout={layout}
                hook={promoConfig.hook}
                name={promoConfig.name}
                role={promoConfig.role}
                photos={promoConfig.photos}
                holdFrames={promoConfig.photoHoldFrames}
                safeZone={zone}
                brand={brand}
              />
            </SceneFade>
          </Sequence>
          <Sequence from={toFrames(scenes.proof.from, fps)} durationInFrames={proofFrames}>
            <SceneFade durationInFrames={proofFrames} enterFrames={0} exitFrames={0}>
              <ProofScene
                layout={layout}
                stats={promoConfig.stats}
                stillSrc={promoConfig.proofPhoto}
                safeZone={zone}
                brand={brand}
              />
            </SceneFade>
          </Sequence>
          <Sequence from={toFrames(scenes.cta.from, fps)} durationInFrames={ctaFrames}>
            <SceneFade durationInFrames={ctaFrames} enterFrames={0} exitFrames={0}>
              <CtaScene
                layout={layout}
                headline={promoConfig.cta.headline}
                url={promoConfig.cta.url}
                button={promoConfig.cta.button}
                logoSrc={promoConfig.assets.logo}
                photos={promoConfig.photos}
                holdFrames={promoConfig.photoHoldFrames}
                captions={promoConfig.clips.map((clip) => clip.caption)}
                safeZone={zone}
                brand={brand}
              />
            </SceneFade>
          </Sequence>
          <CornerBrackets safeZone={zone} color={brand.accent} />
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.72) 100%)",
            pointerEvents: "none",
          }}
        />
        <AbsoluteFill
          style={{
            background: brand.accent,
            opacity: hit * 0.1,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
        <FilmGrain />
        {promoConfig.debug.showSafeZone ? (
          <div
            style={{
              position: "absolute",
              top: zone.top,
              right: zone.right,
              bottom: zone.bottom,
              left: zone.left,
              border: `2px dashed ${brand.accent}`,
              pointerEvents: "none",
              zIndex: 40,
            }}
          />
        ) : null}
        <AudioLayer
          track={promoConfig.audio.track}
          whoosh={promoConfig.audio.whoosh}
          impact={promoConfig.audio.impact}
          transitions={[scenes.hook.from, scenes.proof.from, scenes.cta.from]}
        />
      </AbsoluteFill>
    </EnergyContext.Provider>
  );
};

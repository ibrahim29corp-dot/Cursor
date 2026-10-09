import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { anton } from "../fonts";
import { withAlpha } from "../lib/color";
import type { Brand, Clip, Layout, SafeZone } from "../types";
import { AssetVideo } from "./AssetVideo";
import { MediaFallback } from "./MediaFallback";
import { SafeContent } from "./SafeContent";

export type ClipsSceneProps = {
  layout: Layout;
  clips: Clip[];
  safeZone: SafeZone;
  brand: Brand;
  durationInFrames: number;
};

export const ClipsScene = ({ layout, clips, safeZone, brand, durationInFrames }: ClipsSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  if (clips.length === 0) {
    return (
      <SafeContent safeZone={safeZone} style={{ justifyContent: "center" }}>
        <MediaFallback label="CLIPS" path="config.clips" accent={brand.accent} text={brand.text} />
      </SafeContent>
    );
  }

  const portrait = layout === "portrait";
  const cols = portrait ? 1 : clips.length;
  const rows = portrait ? clips.length : 1;
  const gap = 14;
  const gridW = width - safeZone.left - safeZone.right;
  const gridH = height - safeZone.top - safeZone.bottom;
  const cellW = (gridW - gap * (cols - 1)) / cols;
  const cellH = (gridH - gap * (rows - 1)) / rows;
  const intro = Math.min(Math.round(fps * 0.16), Math.max(4, Math.round(durationInFrames * 0.06)));
  const slice = Math.max(1, durationInFrames - intro) / clips.length;
  const handoff = Math.round(fps * 0.12);

  const cellFor = (index: number) => {
    const col = portrait ? 0 : index;
    const row = portrait ? index : 0;
    return {
      x: safeZone.left + col * (cellW + gap),
      y: safeZone.top + row * (cellH + gap),
      w: cellW,
      h: cellH,
    };
  };

  const startFor = (index: number) => intro + index * slice - (index === 0 ? 0 : handoff);
  const endFor = (index: number) =>
    index === clips.length - 1 ? durationInFrames : intro + (index + 1) * slice;

  const weightFor = (index: number) => {
    const start = startFor(index);
    if (frame < start) {
      return 0;
    }
    const enter = spring({
      frame: frame - start,
      fps,
      config: { damping: 14, stiffness: 340, mass: 0.28, overshootClamping: true },
    });
    if (index === clips.length - 1) {
      return enter;
    }
    const exit = interpolate(frame, [endFor(index) - handoff, endFor(index)], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return enter * exit;
  };

  const weights = clips.map((_, index) => weightFor(index));
  let active = 0;
  let best = 0;
  weights.forEach((weight, index) => {
    if (weight > best) {
      best = weight;
      active = index;
    }
  });
  const captionOpacity = interpolate(best, [0.4, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const captionY = interpolate(captionOpacity, [0, 1], [18, 0]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {clips.map((clip, index) => {
        const weight = weights[index];
        const cell = cellFor(index);
        const x = interpolate(weight, [0, 1], [cell.x, 0]);
        const y = interpolate(weight, [0, 1], [cell.y, 0]);
        const w = interpolate(weight, [0, 1], [cell.w, width]);
        const h = interpolate(weight, [0, 1], [cell.h, height]);
        const local = Math.max(0, frame - startFor(index));
        const punch = spring({
          frame: local,
          fps,
          config: { damping: 12, stiffness: 360, mass: 0.26, overshootClamping: true },
        });
        const pulse = interpolate(Math.sin((local / fps) * Math.PI * 6), [-1, 1], [1, 1.07]);
        const punched = interpolate(punch, [0, 1], [1.34, 1]) * pulse;
        const scale = interpolate(weight, [0, 1], [1.04, punched]);
        const wipe = interpolate(weight, [0, 0.7], [20, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const radius = interpolate(weight, [0, 1], [18, 0]);

        return (
          <div
            key={`${clip.src}-${index}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: h,
              overflow: "hidden",
              zIndex: 2 + Math.round(weight * 10),
              borderRadius: radius,
              clipPath: `inset(0 ${wipe}% 0 0 round ${radius}px)`,
              boxShadow: `inset 0 0 0 ${interpolate(weight, [0, 1], [3, 0])}px ${brand.accent}`,
            }}
          >
            <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})` }}>
              <AssetVideo
                src={clip.src}
                fallbackLabel={`CLIP ${index + 1}`}
                accent={brand.accent}
                text={brand.text}
              />
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, ${withAlpha(brand.background, 0.78)} 0%, ${withAlpha(brand.background, 0)} 46%)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000",
                opacity: interpolate(weight, [0, 1], [0.28, 0]),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: 1 - weight,
              }}
            >
              <div style={{ width: 8, alignSelf: "stretch", background: brand.accent }} />
              <div
                style={{
                  fontFamily: anton,
                  fontSize: portrait ? 36 : 28,
                  color: brand.text,
                  letterSpacing: 0.5,
                  lineHeight: 0.9,
                }}
              >
                {clip.caption}
              </div>
            </div>
          </div>
        );
      })}
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
            {clips[active].caption}
          </div>
        </div>
      </SafeContent>
    </AbsoluteFill>
  );
};

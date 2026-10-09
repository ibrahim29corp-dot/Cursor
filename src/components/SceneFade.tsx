import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type SceneFadeProps = {
  durationInFrames: number;
  enterFrames?: number;
  exitFrames?: number;
  children: ReactNode;
};

/** Crossfades a scene in and out so timeline changes are never hard cuts. */
export const SceneFade = ({
  durationInFrames,
  enterFrames = 8,
  exitFrames = 8,
  children,
}: SceneFadeProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 160, mass: 0.7 },
    durationInFrames: Math.max(enterFrames, 1),
  });
  const enterOpacity =
    enterFrames === 0
      ? 1
      : interpolate(frame, [0, enterFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.quad),
        });
  const exitOpacity =
    exitFrames === 0
      ? 1
      : interpolate(frame, [durationInFrames - exitFrames, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const enterScale = enterFrames === 0 ? 1 : interpolate(enter, [0, 1], [1.04, 1]);
  const exitScale =
    exitFrames === 0
      ? 1
      : interpolate(frame, [durationInFrames - exitFrames, durationInFrames], [1, 1.025], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill style={{ opacity: enterOpacity * exitOpacity, transform: `scale(${enterScale * exitScale})` }}>
      {children}
    </AbsoluteFill>
  );
};

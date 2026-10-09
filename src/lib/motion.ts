import { interpolate, spring } from "remotion";

export const slamSpring = {
  damping: 16,
  stiffness: 420,
  mass: 0.28,
  overshootClamping: true,
};

export const settleSpring = {
  damping: 18,
  stiffness: 280,
  mass: 0.36,
  overshootClamping: true,
};

/** 1 on the beat, then back to 0. Driven by spring so the hit eases out. */
export const beatIntensity = (frame: number, fps: number, beatTimes: readonly number[]) => {
  let max = 0;
  for (const time of beatTimes) {
    const beatFrame = Math.round(time * fps);
    const dt = frame - beatFrame;
    if (dt < 0 || dt > 4) {
      continue;
    }
    const settled = spring({
      frame: dt,
      fps,
      config: { damping: 18, stiffness: 460, mass: 0.22, overshootClamping: true },
      durationInFrames: 4,
    });
    const impulse = interpolate(settled, [0, 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    if (impulse > max) {
      max = impulse;
    }
  }
  return max;
};

/** Largest size that keeps the longest line inside `availableWidth`. */
export const fitFontSize = (
  text: string,
  availableWidth: number,
  cap: number,
  widthFactor = 0.62,
) => {
  const longest = text.split("\n").reduce((max, line) => Math.max(max, line.trim().length), 1);
  const fitted = availableWidth / (Math.max(longest, 1) * widthFactor);
  return Math.max(22, Math.min(cap, Math.floor(fitted)));
};

export const toFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

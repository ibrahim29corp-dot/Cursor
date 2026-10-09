import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { hasStaticFile, publicSrc } from "../lib/assets";

type PhotoFlashProps = {
  photos: readonly string[];
  /** Frames each photo stays up before the next one. */
  holdFrames: number;
  offset?: number;
};

const positions = ["center 16%", "center 30%", "center 10%", "center 40%", "center 22%"];

/** Hard-cuts through a list of photos so the picture changes every few frames. */
export const PhotoFlash = ({ photos, holdFrames, offset = 0 }: PhotoFlashProps) => {
  const frame = useCurrentFrame();
  const ready = photos.filter((src) => hasStaticFile(src));
  if (ready.length === 0 || holdFrames < 1) {
    return null;
  }
  const slot = Math.floor((frame + offset) / holdFrames);
  const index = slot % ready.length;
  const local = (frame + offset) % holdFrames;
  const scale = interpolate(local, [0, Math.max(holdFrames - 1, 1)], [1.12, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0B0B0B" }}>
      <Img
        src={publicSrc(ready[index])}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: positions[index % positions.length],
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};

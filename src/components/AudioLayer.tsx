import { Audio, Sequence, interpolate, useVideoConfig } from "remotion";
import { hasStaticFile, publicSrc } from "../lib/assets";
import { toFrames } from "../lib/motion";

export type AudioLayerProps = {
  track: string;
  whoosh: string;
  impact: string;
  transitions: number[];
};

export const AudioLayer = ({ track, whoosh, impact, transitions }: AudioLayerProps) => {
  const { fps, durationInFrames } = useVideoConfig();
  const trackReady = hasStaticFile(track);
  const whooshReady = hasStaticFile(whoosh);
  const impactReady = hasStaticFile(impact);

  return (
    <>
      {trackReady ? (
        <Audio
          src={publicSrc(track)}
          volume={(frame) => {
            const fadeIn = interpolate(frame, [0, 8], [0, 0.72], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames - 1], [0.72, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return Math.min(fadeIn, fadeOut);
          }}
        />
      ) : null}
      {impactReady
        ? transitions.map((time) => (
            <Sequence key={`impact-${time}`} from={toFrames(time, fps)} durationInFrames={Math.round(fps * 0.6)}>
              <Audio src={publicSrc(impact)} volume={0.62} />
            </Sequence>
          ))
        : null}
      {whooshReady
        ? transitions
            .filter((time) => time > 0)
            .map((time) => (
              <Sequence
                key={`whoosh-${time}`}
                from={Math.max(0, toFrames(time, fps) - 6)}
                durationInFrames={Math.round(fps * 0.5)}
              >
                <Audio src={publicSrc(whoosh)} volume={0.38} />
              </Sequence>
            ))
        : null}
    </>
  );
};

import { useState } from "react";
import { OffthreadVideo } from "remotion";
import { hasStaticFile, publicSrc } from "../lib/assets";
import { MediaFallback } from "./MediaFallback";

type AssetVideoProps = {
  src: string;
  fallbackLabel: string;
  accent: string;
  text: string;
};

export const AssetVideo = ({ src, fallbackLabel, accent, text }: AssetVideoProps) => {
  const [failed, setFailed] = useState(false);
  if (!hasStaticFile(src) || failed) {
    return <MediaFallback label={fallbackLabel} path={src} accent={accent} text={text} />;
  }
  return (
    <OffthreadVideo
      src={publicSrc(src)}
      muted
      volume={0}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
      onError={() => setFailed(true)}
    />
  );
};

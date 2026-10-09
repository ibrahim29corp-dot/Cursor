import { useState, type CSSProperties } from "react";
import { Img } from "remotion";
import { hasStaticFile, publicSrc } from "../lib/assets";
import { MediaFallback } from "./MediaFallback";

type AssetImageProps = {
  src: string;
  fallbackLabel: string;
  accent: string;
  text: string;
  style?: CSSProperties;
};

export const AssetImage = ({ src, fallbackLabel, accent, text, style }: AssetImageProps) => {
  const [failed, setFailed] = useState(false);
  if (!hasStaticFile(src) || failed) {
    return <MediaFallback label={fallbackLabel} path={src} accent={accent} text={text} />;
  }
  return (
    <Img
      src={publicSrc(src)}
      style={{ width: "100%", height: "100%", objectFit: "contain", ...style }}
      onImageError={() => setFailed(true)}
    />
  );
};

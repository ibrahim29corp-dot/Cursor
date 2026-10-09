import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import type { SafeZone } from "../types";

type SafeContentProps = {
  safeZone: SafeZone;
  children: ReactNode;
  style?: CSSProperties;
};

/** Pads children into the platform safe zone. Media can bleed outside this. */
export const SafeContent = ({ safeZone, children, style }: SafeContentProps) => {
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        paddingTop: safeZone.top,
        paddingRight: safeZone.right,
        paddingBottom: safeZone.bottom,
        paddingLeft: safeZone.left,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

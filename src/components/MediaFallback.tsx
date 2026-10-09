import { anton, bebas } from "../fonts";

type MediaFallbackProps = {
  label: string;
  path: string;
  accent: string;
  text: string;
};

/** Rectangle stand-in used when a public asset is missing or fails to load. */
export const MediaFallback = ({ label, path, accent, text }: MediaFallbackProps) => {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        background:
          "repeating-linear-gradient(-45deg, #141414, #141414 16px, #1c1c1c 16px, #1c1c1c 32px)",
        border: `3px solid ${accent}`,
        boxShadow: "inset 0 0 48px rgba(83,252,24,0.14)",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: anton,
          fontSize: 48,
          color: accent,
          letterSpacing: 1,
          lineHeight: 0.9,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: bebas,
          fontSize: 22,
          letterSpacing: 1.5,
          color: text,
          opacity: 0.82,
          maxWidth: "90%",
        }}
      >
        {path}
      </div>
    </div>
  );
};

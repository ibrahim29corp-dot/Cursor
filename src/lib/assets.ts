import { getStaticFiles, staticFile } from "remotion";

/** True when `public/<relativePath>` is present. Missing media falls back to a placeholder. */
export const hasStaticFile = (relativePath: string) => {
  const target = relativePath.replace(/^\/+/, "");
  return getStaticFiles().some((file) => file.name === target);
};

export const publicSrc = (relativePath: string) => staticFile(relativePath.replace(/^\/+/, ""));

export type Layout = "portrait" | "landscape";

export type SafeZone = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Brand = {
  background: string;
  accent: string;
  text: string;
  muted: string;
  card: string;
};

export type Stat = {
  label: string;
  /** Verified number to count up to. Leave null until you have a real figure. */
  value: number | null;
  /** Shown while value is null. Keep the brackets so the slot is obvious. */
  placeholder: string;
  /** Appended as written, for example " hrs" or "%". */
  suffix?: string;
};

export type Clip = {
  src: string;
  caption: string;
};

export type SceneWindow = {
  /** Start time in seconds. */
  from: number;
  /** Length in seconds, including the overlap into the next scene. */
  duration: number;
};

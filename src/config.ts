import type { Brand, Clip, Layout, SafeZone, SceneWindow, Stat } from "./types";

/**
 * Everything you should edit lives in this file.
 * Scenes read these values as props, so copy, stats, colors, timing, and
 * asset paths can change without opening a component.
 *
 * Line breaks: put a real newline in a string with \n.
 * Stats: leave `value` null until you have a verified number. The bracket
 * placeholder renders instead. Do not drop in estimated counts.
 */

const overlapSeconds = 0.14;

export const promoConfig = {
  fps: 30,
  durationInSeconds: 20,
  compositions: {
    portrait: {
      id: "SneakoPromo9x16",
      width: 1080,
      height: 1920,
    },
    landscape: {
      id: "SneakoPromo16x9",
      width: 1920,
      height: 1080,
    },
  },
  brand: {
    background: "#0B0B0B",
    accent: "#53FC18",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.76)",
    card: "#121212",
  } satisfies Brand,
  /**
   * Text stays inside these insets.
   * Portrait top/bottom match phone-platform UI (stories, reels, shorts).
   * Landscape uses a normal title-safe margin.
   */
  safeZone: {
    portrait: { top: 250, right: 80, bottom: 400, left: 64 },
    landscape: { top: 72, right: 88, bottom: 88, left: 88 },
  } satisfies Record<Layout, SafeZone>,
  scenes: {
    hook: { from: 0, duration: 2 + overlapSeconds },
    who: { from: 2, duration: 4 + overlapSeconds },
    proof: { from: 6, duration: 6 + overlapSeconds },
    clips: { from: 12, duration: 5 + overlapSeconds },
    cta: { from: 17, duration: 3 },
  } satisfies Record<"hook" | "who" | "proof" | "clips" | "cta", SceneWindow>,
  hook: "THE STREAM\nEVERYONE'S\nTALKING ABOUT",
  name: "SNEAKO",
  role: "KICK STREAMER",
  tagline: "UNFILTERED. LIVE.",
  cta: {
    headline: "WATCH LIVE\nON KICK",
    url: "kick.com/sneako",
    button: "FOLLOW",
  },
  stats: [
    { label: "PEAK VIEWERS", value: null, placeholder: "[PEAK VIEWERS]" },
    { label: "FOLLOWERS", value: null, placeholder: "[FOLLOWERS]" },
    { label: "HOURS STREAMED", value: null, placeholder: "[HOURS STREAMED]" },
  ] satisfies Stat[],
  clips: [
    { src: "clips/clip1.mp4", caption: "UNSCRIPTED" },
    { src: "clips/clip2.mp4", caption: "NO FILTER" },
    { src: "clips/clip3.mp4", caption: "IN THE MOMENT" },
  ] satisfies Clip[],
  /**
   * Seconds where the picture shakes and the type glitches.
   * The placeholder track is built on these same hits. If you swap the song,
   * replace this list with that song's downbeats.
   */
  beatTimes: [
    0.1, 0.43, 0.77, 1.1, 1.43, 1.77, 2, 2.43, 2.77, 3.1, 3.43, 3.77, 4.1, 4.43, 4.77,
    5.1, 5.43, 5.77, 6, 6.43, 6.77, 7.1, 7.43, 7.77, 8.1, 8.43, 8.77, 9.1, 9.43, 9.77,
    10.1, 10.43, 10.77, 11.1, 11.43, 11.77, 12, 12.43, 12.77, 13.1, 13.43, 13.77, 14.1,
    14.43, 14.77, 15.1, 15.43, 15.77, 16.1, 16.43, 16.77, 17, 17.43, 17.77, 18.1, 18.43,
    18.77, 19.1, 19.55,
  ],
  assets: {
    cutout: "images/sneako-cutout.png",
    logo: "images/kick-logo.svg",
  },
  audio: {
    track: "audio/track.mp3",
    whoosh: "sfx/whoosh.mp3",
    impact: "sfx/impact.mp3",
  },
  /** Flip on while checking that type sits inside the safe zone. */
  debug: {
    showSafeZone: false,
  },
};

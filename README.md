# Sneako on Kick

A 6.5-second Remotion promo, 1080×1920 at 30fps, built to send people to [kick.com/sneako](https://kick.com/sneako). The same scenes also render as 1920×1080.

Copy, stats, colors, timing, beat hits, and file paths all live in [`src/config.ts`](src/config.ts). Swap those values instead of editing scene components.

## Setup

Node 18 or newer.

```bash
npm install
npm run dev
```

Remotion Studio opens with two compositions:

| Composition | Size | Use |
| --- | --- | --- |
| `SneakoPromo9x16` | 1080×1920 | Primary promo |
| `SneakoPromo16x9` | 1920×1080 | Landscape cut of the same scenes |

## Render

```bash
npm run render
npm run render:landscape
```

Outputs:

- `out/sneako-promo-9x16.mp4`
- `out/sneako-promo-16x9.mp4`

## Change the words

Open `src/config.ts`.

| Field | What it is |
| --- | --- |
| `hook` | Opening line. Use `\n` for a line break. |
| `name`, `role`, `tagline` | Name lockup. Leave `role` or `tagline` as `""` to hide that line. |
| `cta.headline`, `cta.url`, `cta.button` | The only call to action. |
| `clips[].caption` | Burned-in caption for that clip. |
| `stats` | Proof cards. See below. |
| `brand` | Background `#0B0B0B`, accent `#53FC18`, text. |
| `safeZone` | Padding that keeps type out of platform UI. |
| `scenes` | Start time and length, in seconds. |
| `beatTimes` | Seconds where the frame shakes and the type glitches. |

The promo is three segments: the open is 1.5 seconds, the stat cards are 2 seconds, and the end card is 3 seconds. Total runtime is 6.5 seconds. Photos cut through the open. At 1.5 seconds they lock on `proofPhoto` until the stat cards leave at 3.5 seconds. The end card then runs until 6.5 seconds, with the photo cuts behind it. The scenes do not overlap.

Every line above is drawn on screen, so the promo still reads with the sound off. Clip scenes also get a caption bar.

## Stats

Do not invent numbers. Leave `value: null` and the card shows the bracket placeholder.

```ts
{ label: "PEAK VIEWERS", value: null, placeholder: "[PEAK VIEWERS]" }
```

When you have a verified figure, set `value` and the card counts up to it. `placeholder` is ignored once `value` is a number. Add a suffix exactly as it should read, including a leading space if you want one:

```ts
{ label: "HOURS STREAMED", value: 840, placeholder: "[HOURS STREAMED]", suffix: " hrs" }
```

## Swap assets

Drop files at these paths, or point `config.assets` / `config.audio` / `config.clips` at new ones. Paths are relative to `public/`.

| Slot | Default path |
| --- | --- |
| Photos | `public/images/sneako-01.jpg` through `sneako-13.jpg` |
| Logo | `public/images/kick-logo.svg` |
| Clips | `public/clips/clip1.mp4`, `clip2.mp4`, `clip3.mp4` |
| Music | `public/audio/track.mp3` |
| Whoosh | `public/sfx/whoosh.mp3` |
| Impact | `public/sfx/impact.mp3` |

`photos` is the set of stills that flash through the hook, name lockup, stats, clip section, and end card. `photoHoldFrames` is how long each one stays up (3 frames is ten cuts a second). Drop more files in `public/images/` and add their paths to that list. The shipped set is thirteen different photos, including a CC0 shot from [Sneako in Malaysia](https://commons.wikimedia.org/wiki/File:Sneako_in_Malaysia.png). The logo can be SVG or PNG. Clip files are optional; the clip section uses `photos` and reads its captions from `clips`.

If a file is missing, that slot renders as a labeled rectangle and the preview still starts. Audio is skipped when its file is missing, instead of failing the render.

The included track, whooshes, and impacts are synthesized placeholders, not a commercial song. Replace `track.mp3` with a track you have rights to, then set `beatTimes` to that track's downbeats so the shakes land on the music. The shipped track was generated from the `beatTimes` already in config.

Whoosh and impact files play at each scene change (0s, 1.5s, 3.5s).

## Safe zones

Portrait text stays out of the top 250px and the bottom 400px (`safeZone.portrait`). Side padding is in that same object if a platform rail covers the type. Landscape uses a normal title-safe margin.

Set `debug.showSafeZone` to `true` to draw the box while you check a layout, then set it back to `false` before rendering.

## Project map

```
src/config.ts                 copy, stats, paths, timing, beats
src/SneakoPromo.tsx           timeline shared by both aspect ratios
src/components/HookScene.tsx  0–1.5s name, hook, photo cuts
src/components/ProofScene.tsx 1.5–3.5s stat cards on one still photo
src/components/CtaScene.tsx   3.5–6.5s end card, captions, photo cuts
src/components/StatCard.tsx   one proof card
src/components/SlamText.tsx   kinetic type
```

Scene components take their copy, brand, and layout as props. `SneakoPromo` is what reads `promoConfig` and hands those props down.

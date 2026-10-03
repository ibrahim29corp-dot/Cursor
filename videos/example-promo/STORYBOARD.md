---
format: 1920x1080
duration: 10s
message: "Example Domain is reserved for documentation examples — no permission needed."
arc: Hook → Product intro → Brand outro
audience: developers and technical writers
mode: autonomous
music: none
---

## Video direction

- palette system: `frame.md` roles only — `cream` (#EEEEEE, the site's own grey) is the ground of every frame; `ink` (#000000) carries all display and body type; `tile` (#E7E7E7) for the one hairline card; `coral` is remapped to the site's link blue (#0000EE) and is the single voltage moment per frame (a highlighted word, the "Learn more" link). No navy code surface — nothing here is code.
- type: display = EB Garamond (sentence case, negative tracking); chrome = JetBrains Mono kicker with the ✱ spike prefix; body = Inter. The "example.com" wordmark is set in the display face.
- motion grammar + reveal model: silent video, so each frame's on-screen text IS the cue track — every piece reveals when the preceding piece has been read, never all at t=0. Long-tail `power3` settles; no bounce, no overshoot. Camera locked in every frame (flat editorial stage).
- rhythm / held frames: Frame 1 is quick and kinetic; Frame 2 is a steady cycle; Frame 3 is the held breather — its final ~1.2s is a still lockup.
- negative list: no purple/blue "AI" gradients, no bokeh, no browser chrome or fake nav, no invented logos (the only mark is the site's own book SVG), no claims the site doesn't make (it is not a service; never imply testing/monitoring). Neither motion failure mode: no slideshow (front-load then freeze), no screensaver (independently floating elements), no lazy breathing, no back-half pan/push.

## Frame 1 — Hook

- scene: "Writing the docs?" lands, then the payoff line types beneath with the URL slot
- voiceover: ""
- duration: 3s
- poster: 2.6s
- transition_in: cut
- status: outline
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation
- beat: curiosity
- blueprint: kinetic-type-beats (Adapt)
- focal: none — typography only
- roles: none
- sfx: none
- asset_candidates:

narrativeRole: names the moment the viewer is in — writing docs and needing a URL in an example — so the next frame's answer lands as relief.
keyMessage: every docs example needs a link that's safe to print.

Adapt: keep sub-shape B (multi-beat statement build on a flat field, each beat its own move); two beats, not three-to-five, because the frame is 3s.
Scene 1 (0.0–1.1s): flat `cream` field; a small JetBrains Mono kicker "✱ FOR DOCUMENTATION" fades up upper-left-of-center, then the display line "Writing the docs?" arrives dead-center via a per-word waterfall arrival (`waterfall-entry`) on a `power3` settle — centered, display ramp, ~55% frame width, upper-third weighted.
Scene 2 (1.1–2.4s): the headline lifts slightly to make room; beneath it the lead line "You need a link that's safe to print." reveals word-by-word (`waterfall-entry`); the word "safe" is the frame's one `coral` (link-blue) accent, with a drawn underline sweeping left→right under it (`css-marker-patterns`, underline form).
Scene 3 (2.4–3.0s): hold the read still — both lines resolved, no drift.

## Frame 2 — Meet example.com

- scene: the "example.com" wordmark pins centre while the site's own sentence cycles through its six languages beneath it
- voiceover: ""
- duration: 4s
- poster: 3.4s
- transition_in: crossfade
- status: outline
- src: compositions/frames/02-intro.html
- type: product_intro
- persuasion: Authority by association
- beat: clarity + relief
- blueprint: fixed-anchor-cycle (Adapt)
- focal: the "example.com" wordmark (typographic)
- roles: none
- sfx: none
- asset_candidates:

narrativeRole: names the product and lands the value claim by beat 2 — reserved, permission-free, understood worldwide.
keyMessage: example.com is reserved for documentation examples — no permission needed.

Adapt: keep the signature move (pinned anchor, adjacent-region cycle that never touches it, resolve into a completed lockup); the cycled states are the site's own six verbatim language lines, steady stepping not a flurry, and the resolve is the English line held.
Scene 1 (0.0–0.8s): `cream` field; the wordmark "example.com" (display-cover ramp, `ink`) fades and settles up into dead-centre-upper position (`spring-pop-entrance`, smooth settle, no overshoot) and PINS — zero movement for the rest of the frame. A 1px `ink`@12% hairline rule draws out beneath it (`svg-path-draw`).
Scene 2 (0.8–2.9s): below the rule, a masked single-line slot steps through the site's own sentence in its translations — Arabic «هذا النطاق مُخصص للاستخدام في أمثلة التوثيق», Chinese «该域名仅用于文档示例», French «Réservé à des exemples de documentation», Russian «Для использования в примерах документации», Spanish «Para uso en ejemplos de documentación» — each a vertical carousel slide-up/fade (`vertical-spring-ticker`), ~0.42s per state, Inter lead ramp at ~60% `ink`. A mono kicker to the left of the slot counts the language code (AR · ZH · FR · RU · ES) in lockstep (`discrete-text-sequence`).
Scene 3 (2.9–4.0s): the cycle lands on English — "Reserved for documentation examples." in full `ink`, and the follow-up "No permission needed." joins on the next line as a per-word reveal, "No permission" in `coral` link-blue; the kicker reads EN. Hold still to the cut.

## Frame 3 — Learn more

- scene: the site's own book icon draws itself on, the wordmark joins it, and a link-blue "Learn more" lands as the sign-off
- voiceover: ""
- duration: 3s
- poster: 2.7s
- transition_in: blur-crossfade
- status: outline
- src: compositions/frames/03-outro.html
- type: branding
- persuasion: Friction reduction
- beat: confidence
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/svg-4e6b1e6c.svg
- roles: svg-4e6b1e6c = cutout (the brand mark, ink stroke)
- sfx: none
- asset_candidates: assets/svg-4e6b1e6c.svg — the site's open-book line icon, the only mark on example.com

narrativeRole: closes on the real identity and the one action the site offers.
keyMessage: example.com — learn more.

Adapt: Brand_Outro "draws on" sub-shape — the mark strokes itself on, wordmark reveals beside it; no formation to clear (Frame 2's blur-crossfade is the clear). Extended with the site's single CTA, the "Learn more" link.
Scene 1 (0.0–1.0s): `cream` field; the book icon (focal, ~18% frame height, `ink`) draws on stroke-by-stroke at centre-left of a centred lockup (`svg-path-draw`), its two small quote marks pop in after the outline closes (`spring-pop-entrance`, smooth).
Scene 2 (1.0–1.8s): the wordmark "example.com" reveals to the icon's right via a left→right mask wipe on a `power3` settle; icon + wordmark form one balanced, centred lockup (~60% width).
Scene 3 (1.8–3.0s): beneath the lockup, "Learn more" in `coral` link-blue fades up with its underline drawing left→right (`css-marker-patterns`, underline), a small mono "→ example.com" chrome line under it. Final ~1.2s held dead still — the last frame, so it may fade to `cream` over the last 0.3s.

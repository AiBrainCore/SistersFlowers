# Sisters Flowers — Phase 3.2  
## Production 3D asset brief (Da Lat studio)

**Status:** WebGL viewer PoC accepted (`/en/hero-3d`).  
**Do not use** the Khronos sample as the final brand Hero.  
**Goal:** one hero-only Sisters bouquet → realistic GLB (preferred) or 360° photo spin (fallback).

This document is for the physical studio + whoever prepares the digital asset.

---

## 1. What to create (creative brief)

Prepare **one** special Hero bouquet (not necessarily the most expensive SKU):

- Readable silhouette from all sides (avoid one “flat” face)
- Mixed botanical colors that fit Sisters palette (greens, pinks, warm yellows, citrus accents optional in wrap/ribbon)
- Real Da Lat flowers + studio wrapping (paper/ribbon as you actually sell)
- Interesting volume: height + width balanced; not a thin single-facing hand-tie only
- Clean stems / wrap base (this becomes the contact with the floor/shadow in 3D)

**Labeling:** this is a brand Hero prop. Catalog products stay 2D photos for now.

---

## 2. Recommended capture method (priority order)

| Priority | Method | Best for | Studio effort | Mobile risk |
|---|---|---|---|---|
| **A (preferred)** | Photogrammetry → cleaned **GLB** | True free orbit, lighting control, glass UI compositing | Medium–high | Medium if optimized |
| **B (strong fallback)** | Turntable **360°** stills (24–36 frames) | Fast, very real look, horizontal spin | Low–medium | Low |
| C (experimental) | Gaussian Splatting | Extreme realism | High | Higher on phones |

**Recommendation for Sisters now:**  
1) Shoot for **B** (safe commercial fallback) **and** enough coverage for **A** in the same session if possible.  
2) Produce **GLB** if reconstruction quality is good; otherwise ship **360°** viewer first, keep GLB as upgrade.

Do **not** invent viewpoints from one photo.

---

## 3. Exact files the studio must provide

### Session setup (both A and B)

- Quiet background: seamless **light paper / soft grey / soft cream** (no busy shelves)
- Soft, even light (2–3 softboxes or bright overcast window + fill). Avoid hard noon sun + harsh shadows
- Bouquet on a **manual turntable** or marked rotating plate
- Camera on **tripod**, fixed height, fixed zoom, fixed white balance
- Same exposure for the whole set (lock ISO/aperture/shutter)
- Shoot **JPEG + RAW** if available (RAW for grading; JPEG for quick 360)

### B — 360° spin set (minimum for a shippable Hero)

Provide a folder:

```
hero-bouquet-360/
  frame-00.jpg … frame-35.jpg   # 36 frames preferred (every 10°)
  # or frame-00 … frame-23       # 24 frames minimum (every 15°)
  poster.jpg                    # best beauty frame for LCP / model-viewer poster
  notes.txt                     # flower list, wrap type, date, photographer
```

Rules:

- Full bouquet in frame with ~8–12% margin
- Center of rotation stays stable (no drifting)
- No people, no logos of other brands in frame
- Resolution: long edge **3000–4000 px** (export web later)

### A — Photogrammetry / reconstruction set (for real GLB)

Same as above, **plus**:

```
hero-bouquet-scan/
  ring-mid/     # full 360 around mid height, ~70–80% overlap
  ring-high/    # slightly above, looking down a bit
  ring-low/     # slightly below, looking up a bit
  detail/       # 15–30 close-ups of petals, wrap, ribbon (sharp)
  poster.jpg
  notes.txt
```

Rules:

- **3 height rings** minimum (Polycam-style multi-height coverage)
- Overlap **~70%+** between neighboring shots
- 80–200 photos total is typical; more is fine if sharp
- Avoid motion blur; use timer / remote
- Optional: one clean **HDRI/environment** photo of the studio light (helps later lighting)

### Explicitly not enough

- 1–5 “nice angles”
- Phone video only (can help as reference, not as final asset alone)
- Heavy Instagram filters / beauty apps baked into source frames

---

## 4. Capture method details (how to shoot at the shop)

1. Build the Hero bouquet and place it on the turntable.  
2. Mark degree ticks (tape) or use a turntable with clicks.  
3. Lock camera. Focus once on the front petal plane.  
4. For **360:** rotate 10° → shoot → repeat (36 frames).  
5. For **scan:** do mid ring fully, then raise camera a bit for high ring, then lower for low ring; add detail shots.  
6. Export `poster.jpg` = the most beautiful single frame (same lighting).  
7. Upload one ZIP to the project owner / Cursor (Drive, WeTransfer, etc.).

Time estimate: **45–90 minutes** for a careful session.

---

## 5. GLB optimization workflow (after capture)

1. Reconstruct (Polycam / RealityScan / Meshroom / professional freelancer).  
2. Clean mesh: remove turntable/floor scraps; fill holes carefully.  
3. Retopology or decimate while protecting petal silhouettes.  
4. Texture: bake to **1–2 atlases** (prefer 2K; try 1K if mobile LCP suffers).  
5. Export **glTF Binary (.glb)**; apply Draco compression if needed.  
6. Target sizes:  
   - **Ideal:** ≤ 2–3 MB  
   - **Acceptable Hero:** ≤ 5 MB with poster + lazy load  
   - Avoid > 8 MB on mobile Hero  
7. Validate in https://modelviewer.dev/editor and in `/en/hero-3d`.  
8. Drop file as e.g. `public/models/sisters-hero-bouquet.glb` and update viewer `src` + poster.

Preserve detail by:

- Keeping higher density on petal edges  
- Avoiding aggressive normal-map-only fakes for thin petals  
- Preferring real PBR textures from the scan over reinvented plastic shaders  

---

## 6. Matching hero poster

- Same bouquet, same session as 3D source  
- Slightly brighter / cleaner grade for web  
- WebP/AVIF derivatives via Next.js `Image`  
- Used as `model-viewer` **poster** (instant LCP) before GLB loads  
- Alt text: descriptive EN/VI, no fake product claims  

---

## 7. Compositing with glass + botanical depth (when asset is ready)

Keep existing `/hero-3d` layout foundation:

- Left: brand + H1 + CTAs (server-rendered HTML)  
- Right: `model-viewer` stage  
- One small **premium glass** chip (“Handcrafted in Da Lat”) — not covering the bouquet  
- Soft botanical gradient / bloom behind the stage (CSS, already in design system)  
- Soft contact shadow under model  
- Remove technical Khronos/WebGL disclaimers from the **final** homepage Hero (keep only on internal preview if needed)

---

## 8. Mobile performance checklist

- Poster first, GLB lazy / after idle if needed  
- `touch-action="pan-y"` so page scroll stays usable  
- Respect `prefers-reduced-motion` (no auto-rotate)  
- One Hero 3D object only (not catalog-wide)  
- Measure on a mid-range Android: LCP, INP, scroll jank  
- If GLB is heavy → ship 360° sprite/viewer first  

---

## 9. Integration step (later — not this task)

When `sisters-hero-bouquet.glb` + `poster` arrive:

1. Replace Khronos file in `public/models/`  
2. Point `BouquetModelViewer` to the new `src` + poster  
3. Soften/remove prototype disclaimers  
4. Compare `/hero-3d` vs homepage; only then promote to homepage after owner approval  

---

## 10. Decision summary

| Question | Answer |
|---|---|
| Rebuild viewer? | **No** |
| Use stock GLB as final brand? | **No** |
| What studio must send first? | **360 set (24–36) + poster**, ideally also **multi-ring scan set** |
| Best final Hero tech? | **Optimized Sisters GLB** in current model-viewer |
| Best backup? | **360 photo spin** of the same bouquet |

---

*Sisters Flowers · Da Lat studio · Visual Identity 2.0 / Phase 3.2*

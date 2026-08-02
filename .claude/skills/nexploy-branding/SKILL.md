---
name: nexploy-branding
description: Creates Nexploy brand content — README banners, GitHub avatars/icons, social cards, OG images, blog headers — in the product's dark design language, as reproducible generator scripts in the Nexploy-branding repo. Trigger when the user asks for a banner, an icon or avatar, a social/OG image, or any new Nexploy visual asset.
---

# Nexploy branding

Nexploy brand assets are **generated, not hand-drawn**. Every asset is a `.cjs` script that
writes an SVG, so the geometry stays parametric and a later tweak is a one-line edit plus a
rebuild — never a manual redraw.

## Where things live

**Branding repo** — `/Users/nathan/Desktop/Projects/Dev (Code)/Nexploy/Nexploy-branding`

```
scripts/          one generator per asset family, plain CommonJS, zero dependencies
  build-nodes.cjs           the original light banner
  build-social.cjs          social formats derived from the banner
  build-banner-dark-v*.cjs  the dark banner line
  build-icon.cjs            the square icon / avatar
banner/  icon/  social/     outputs (SVG, plus PNG where a raster is needed)
```

**Website** — `/Users/nathan/Developer/Web/Desktop/nexploy/website/apps/web` (`pnpm dev`, port 3001)

This is the **source of truth for the design language**. Read it before inventing a value:

| What | Where |
| --- | --- |
| colour + font tokens | `app/globals.css` (`@theme` block) |
| node category colours | `lib/pipeline.ts` → `categoryHex` |
| node card anatomy | `components/common/pipeline-node.tsx` |
| canvas composition | `components/sections/pipeline.tsx` |
| existing OG image | `app/opengraph-image.tsx` |

## Design language

Tokens are stored as `oklch` in `globals.css`; SVG needs hex. Converted values:

| Token | Hex | Use |
| --- | --- | --- |
| `void` | `#0A0A0A` | page / canvas background |
| `slab` | `#171717` | cards, panel header bars |
| `riser` | `#262626` | raised surfaces |
| `edge` / `border` | `#313131` | idle borders |
| `chalk` | `#FAFAFA` | primary text, the logo mark |
| `muted-foreground` | `#A1A1A1` | body copy, taglines |
| `signal` (primary) | `#155DFC` | accents, central glow, `$` prompt |

Node categories — use these exact hexes, they mirror `categoryHex`:

`source #2b7fff` · `build #ff6900` · `deploy #00c951` · `flow #0ea5e9` · `script #a855f7`
`config #64748b` · `files #6366f1` · `database #14b8a6` · `integration #f43f5e` · `utility #efb100`

Type: **Geist** (sans) and **Geist Mono**. Geist may not be installed locally, so always emit the
full fallback stack:

```js
const SANS = "'Geist','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Geist Mono','SFMono-Regular',ui-monospace,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace";
```

Mono is for chrome and metadata (file names, commands, status), sans for the wordmark and
human-facing copy. Lowercase in mono, sentence case in sans.

## Composition recipe

**Background**, in this order:

```
rect fill #0A0A0A
rect fill url(#dots)                     dot field, see below
ellipse centre  fill url(#hubGlow)       signal, stops 0.30 / 0.09 / 0 at 0 / 0.55 / 1
ellipse top     fill url(#topGlow)       #FFFFFF at 5% → 0
```

Glow opacity is **size-dependent**: 0.30 reads as a faint haze across a 1280px banner but turns a
512px square navy. Recalibrate per format — the icon uses 0.17 with a wider radius.

**The dot field is laid out, never tiled from the origin.** A `<pattern>` on a full-bleed rect
anchors at (0,0), which drops a column of dots at x=1 — inside the 1.5px border — and leaves
whatever remainder the division happens to produce at the far edges, so the bottom row ends up
all but touching. Fit a whole number of steps into the visible area instead, then centre the run:

```js
function dotRun(from, to, step) {
    const minGap = step * 0.8;
    const span = to - from;
    const length = Math.floor((span - minGap * 2) / step) * step;
    return { start: from + (span - length) / 2, length };
}

const x = dotRun(0, W, step);
const y = dotRun(barBottom, H, step);   // the chrome bar is opaque: the field starts under it
```

Then offset the pattern onto the run and clip it with a rect sized to the run, `dot` being the
circle radius (`step / 20`):

```
patternTransform="translate(x.start - dot, y.start - dot)"
<rect x="x.start - dot" y="y.start - dot" width="x.length + dot*2" height="y.length + dot*2"/>
```

Vertical margins are measured from the **bar**, not the canvas top, or the field reads as pushed
down. Check the result by parsing the `patternTransform` and the field rect back out of the SVG —
left/right and top/bottom must match to within a rounding unit. On the 1280×384 banner this gives
20px either side and 19px top and bottom.

**Node cards** (mirrors `pipeline-node.tsx`):

```
80×80, rx 22 (rounded-3xl = radius + 12)
outer  rect fill {hex} at 24%, feGaussianBlur stdDeviation 11    ← the glow
card   rect fill #171717, stroke {hex}, stroke-width 2
tile   rect 44×44 rx 14, fill {hex} at 12%, centred
icon   24×24 Lucide path, stroke {hex}, stroke-width 1.7, no fill
port   circle r 7, fill {hex}, stroke #171717 width 2.5, on the anchor
```

**Every measurement in a card is a fraction of `size`** — radius `0.275`, tile `0.55`, tile radius
`0.175`, card border and edge `0.025`, port radius `0.0875`. Keep it that way so a card reads
identically at 62px on a LinkedIn cover and 248px on YouTube channel art.

The icon is the one that bites. It is drawn in its native 24×24 space inside a
`scale(size / 80)` group, so its `stroke-width` is already multiplied by that scale — write a bare
`1.7` and let the transform do the work. Dividing by the scale to "compensate" cancels it and pins
the stroke to 1.7 *absolute* units at every size, which reads thin on large assets and heavy on
small ones. Sanity check: the rendered icon stroke over the card border should be a constant ratio
(0.85) across the whole set.

**Edges** — cubic béziers from a node anchor to a hub point, stroked with a `userSpaceOnUse`
linear gradient that fades the node colour to zero:

```
stops: {hex}@0.95 → {hex}@0.5 (0.55) → {hex}@0
```

The gradient axis end is the **fade point**, and where you put it is the whole trick: past that
point the line is invisible, so it dissolves into the central glow instead of colliding with the
wordmark. See "Fading an edge before it hits text" below.

**An edge always takes the shortest way out of its card.** Never hand-set which face it leaves
from — derive it, or it breaks the moment a format changes shape. A node above the hub leaves by
its **bottom**, one below leaves by its **top**, one beside it leaves by the facing **side**:

```js
function sideFor(node, hub) {
    const dx = hub.x - node.x;
    const dy = hub.y - node.y;
    if (Math.abs(dy) > Math.abs(dx) * 0.8) return dy > 0 ? 'b' : 't';
    return dx > 0 ? 'r' : 'l';
}
```

The `0.8` biases a near-tie toward vertical: on a tall canvas like a 1080×1920 story the deltas
come out almost equal, but a node that far above the lockup reads as stacked, and an edge leaving
sideways then hooking down looks like it is wrapping around the card.

The curve must start along the **same axis** as the face it leaves — a horizontal anchor needs the
horizontal cubic (`C a.x+dx,a.y … hub.x-dx,hub.y`), a vertical one the vertical cubic — otherwise
the path kinks the instant it leaves the port. Pass the side into the path builder; don't let the
two functions each run their own dominance test and disagree.

**On a strip, one node per side — never two.** Formats with almost no height (a 1128×191 company
cover, a 1920×384 subreddit banner) have room for a single row, so two cards on the same side end
up collinear and the outer one's wire runs straight through the inner card. There is no vertical
room to offset them, so drop to one card per side: `source` left, `deploy` right.

Sit it midway between the canvas margin and the edge of the lockup, which keeps the gap equal on
both sides of the card and leaves the wire enough run to read before it fades:

```js
const lockupHalf = (MARK_W * (markH / MARK_H) + markH * 0.45 + markH * 0.87 * 4) / 2;
const bandFrom = size * 0.35;
const bandTo = W / 2 - lockupHalf - size * 0.35;
const left = (bandFrom + bandTo) / 2;
const right = W - left;
```

**Fill the top-centre slot when the format allows it.** The graph carries a node below the lockup
(`utility` / `save-version`); on any canvas with a band between the chrome bar and the top of the
lockup, add the mirroring one above it — `flow` sky `#0ea5e9` with the Lucide `workflow` glyph.
It balances the composition instead of leaving a hole over the wordmark. Gate it on real space,
never on the format name — and on **two** gates, not one: the card has to fit, *and* the edge that
survives the fade has to be long enough to read. A card wired by a 12px stub looks broken, worse
than no card at all, so drop the node in that case.

```js
function topCentreNode(W, barBottom, lockupTop, size, hub, boxes) {
    const margin = size * 0.25;
    const band = lockupTop - barBottom;
    if (band < size + margin * 2) return [];

    const node = { x: W / 2, y: barBottom + band / 2, category: 'flow', icon: 'workflow' };
    const a = anchorOf(node, size, sideFor(node, hub));
    const run = fadeFor(a, hub, boxes) * Math.hypot(hub.x - a.x, hub.y - a.y);
    return run < size * 0.5 ? [] : [node];
}
```

The second gate matters more than it looks. In the `wide` layout the hub sits at 33% of the content
area, so a card can clear the band and still leave only ~12px of visible edge before the fade kills
it against the lockup box. Across the social set only the `stack` formats pass both gates.

**Panel chrome** — a header bar reproduces the site's pipeline panel: `#171717` fill, a bottom
rule, mono 12.5px on the left (`nexploy / self-hosted, powered by Docker`), mono 11.5px
right-aligned. Filling the bar opaque is what makes the dot texture stop at it and reads as a
separate surface.

**One border colour, one border thickness** — every rule in the frame (outer border, chrome-bar
rule, any future divider) uses the same `#FFFFFF` at 10% and the same width. Declare them once:

```js
const BORDER = 1.5;
const BORDER_INK = '#FFFFFF';
const BORDER_ALPHA = 0.1;
```

Two different alphas read as two different borders even though both are "white on dark". Inner
rules must also stop at `BORDER` (`x1="${BORDER}" … x2="${W - BORDER}"`), not run to the canvas
edge: the outer border occupies the band `0 → BORDER`, so an overlapping rule stacks two
translucent whites and lights up the corner. Verify by sampling the junction pixel against a
mid-span border pixel — same backdrop, same value.

Note the values differ by backdrop, not by colour: 10% white over the `#171717` bar reads ~46,
over `#0a0a0a` it reads ~35. Compare like with like.

**The mark** — reuse the two paths from any existing generator; never re-trace it.
At `scale(1)` its bbox is **487.18 × 534.98** with origin `(0,0)`. To place it at height `H`:

```js
const SCALE = H / 534.98;
const TX = (WIDTH - 487.18 * SCALE) / 2;   // for a centred mark
```

## Versioning — mandatory

**Never overwrite a shipped SVG.** A revision is a new script and a new file:

```
scripts/build-banner-dark-v7.cjs  →  banner/nexploy-banner-dark-v7.svg
scripts/build-banner-dark-v8.cjs  →  banner/nexploy-banner-dark-v8.svg
```

Copy the previous script, edit, bump the output name. Older versions stay reproducible, and the
user can always go back to a layout they preferred. The dark banner line reached v8 this way.

## Workflow

1. **Read the tokens** from the website before writing anything — don't work from memory.
2. **Write the generator** in `scripts/`, run `node scripts/build-<asset>.cjs`.
3. **Preview in Chrome.** `file://` URLs are blocked for the browser tools, so serve the file:

```bash
cd <scratchpad> && cp <asset>.svg . && cat > preview.html <<'EOF'
<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&family=Geist+Mono&display=swap" rel="stylesheet">
<style>html,body{margin:0}img{display:block}</style></head>
<body><img src="asset.svg?v=1" width="1280" height="384"></body></html>
EOF
(python3 -m http.server 8977 --bind 127.0.0.1 >/dev/null 2>&1 &)
```

Then `navigate` to `http://127.0.0.1:8977/preview.html` and capture with `computer` →
`action: "zoom"` over the exact asset region: zoom is 1:1, so a 1280×384 region gives a
1280×384 image you can actually judge. Bump the `?v=` query on every rebuild to dodge the cache.
**Kill the server when done** (`pkill -f "http.server 8977"`).

4. **Iterate on the render, not on the code.** Ask whether the composition is balanced, whether
   any line crosses type, whether glows are calibrated for the size.
5. **Export PNG** only when the target needs a raster (GitHub avatars do; READMEs don't).

## PNG export

There is no rsvg / cairosvg / ImageMagick / Inkscape on this machine. Use macOS `qlmanage`:

```bash
qlmanage -t -s 512 -o . icon.svg     # → icon.svg.png
```

It renders onto a **square canvas** and **aspect-fills** it, so a non-square SVG comes back scaled
up and cropped — not padded. The fix is to nest the asset inside a square wrapper, which makes
fill and fit identical, then trim the padding:

```js
<svg width="{side}" height="{side}" viewBox="0 0 {side} {side}">
  <rect width="{side}" height="{side}" fill="#0A0A0A"/>
  <svg x="0" y="0" width="{W}" height="{H}" viewBox="0 0 {W} {H}"> …asset… </svg>
</svg>
```

`scripts/rasterize.cjs` does this for the whole social tree, including the crop — it carries a
small PNG decoder/encoder on Node's `zlib` because nothing else on the machine can. Output is
lossless; verify a corner pixel is `#0A0A0A` at alpha 255 if in doubt.

**Geist is not installed on this machine**, so rasters fall back to Helvetica. The SVGs are
unaffected. Flag this whenever PNGs are the deliverable, and re-run the rasteriser if the family
ever gets installed.

## Format specs

| Asset | Size | Notes |
| --- | --- | --- |
| README banner | 1280×384, `rx 20` | `#FFFFFF` at 10% border, SVG only |
| GitHub avatar | 500×500 PNG | GitHub's documented recommendation |
| Icon, general | 512 / 1024 PNG + 512 SVG source | |
| Social | see `social/README.md` | 23 assets, one folder per network, SVG + PNG |

**Avatars carry no rounded corners.** GitHub applies its own mask — a circle for user accounts, a
rounded square for orgs — and a baked-in radius gets cropped crooked. Keep the mark's bbox corners
inside the inscribed circle: at 330px tall on 512 the corners sit 223px from centre against a
256px radius, which is the practical maximum.

## Gotchas

**Fading an edge before it hits text — solve it, never hand-pick it.** Three traps, all of which
cost a revision round:

1. *The stop must sit ON the curve.* The gradient axis is a straight line and the wire is a cubic,
   so the point that actually vanishes is where the perpendicular through the stop cuts the curve,
   not the stop itself. A stop placed beside its own wire fades somewhere unintended — one of the
   banner's sat 15px off.
2. *Mathematically zero ≠ visibly gone.* The tail of the ramp is under 10% opacity and reads as
   nothing, so the wire disappears about 11px before its stop.
3. *Equal stops do not give equal clearance.* The ramp is uniform **along the axis**, so the same
   loss of opacity spreads over far more pixels on a shallow wire than on a steep one. Aiming five
   stops at the ink gave 13px of clearance on a diagonal wire and 27px on a near-horizontal one.

So aim at the vanishing point and solve for the stop. Declare a boundary per wire — the tagline
baseline for anything arriving from below, the lockup's outer edge from the sides — then:

```js
const FADE_GAP = 15;     // clearance between the ink and where the wire reaches zero
const VISIBLE_END = 1;   // projection the vanishing point must land on

// 1. walk the cubic to the point FADE_GAP short of the ink — that is where it must vanish
// 2. bisect the stop's own parameter until that point projects onto the axis at VISIBLE_END
```

These are the approved values. At `VISIBLE_END = 1` the search collapses to "put the stop on the
curve, FADE_GAP before the ink" — keep the projection form anyway, since dropping it below 1 is the
knob that trades a longer visible run against a softer tail. Both ends stay on the curve, which is
also what keeps the fade pointing along the wire instead of across it.

**Scale the gap, don't hard-code it.** Social assets run 240px to 2560px, so 15px is a fifth of a
Product Hunt thumbnail and invisible on a YouTube banner. Express it against the node card —
`FADE_GAP_RATIO = 15 / 80` — which returns exactly 15 at the banner's 80px card.

Clearance then measures 18px on the banner and 17–26px on the social set, with zero overlap
anywhere. It is not identical across formats and cannot be: the ramp is linear, so a long wire
crosses the same opacity range over more pixels than a short one. What is identical is where each
wire reaches zero.

Pick boundaries that do not depend on the font. The tagline baseline is a design constant and the
lockup's left edge is the mark's own origin, but its right edge is a glyph edge — mirror the left
one about the canvas centre instead, or every machine that actually has Geist gets a different
result from the Helvetica render you measured.

**Monospace is 0.646em per character here, not 0.6.** The textbook advance ignores the header's own
`letter-spacing`, and the 7% shortfall is enough to let the chrome bar's two runs pass a fit test
they should fail and collide — it did, on every 1080px asset. Measure the advance off a render, and
size the fit test with a real gap between the runs rather than a fudge term. Derive character
counts with `.length` instead of writing them down; the command string had been counted as 47 when
it is 48.

**Verify wires by difference, not by colour.** Sampling "blueish pixels" to find where a wire ends
also catches the hub glow and the node cards, which is how a first measurement reported the blue
wire *overshooting* its boundary. Render the asset twice — once normally, once with the edge paths
stripped — and diff: the wire is then the only thing left.

**Letter-spacing changes the block width.** `letter-spacing` applies after every glyph including
the last, so N glyphs at `+1px` widen the wordmark by N px. Re-centre the logo group's `translate x`
after any tracking change — "Nexploy" going from `-1.5` to `2` widened it ~25px and needed a 12px
shift left.

**Never use `dominant-baseline` — bake the baseline.** Its offset is resolved from the font's
metric tables, so it differs per engine *and* per resolved font (Geist installed vs the Inter /
Menlo / Helvetica fallbacks a visitor actually gets). Worse, WebKit ignores it entirely when the
glyphs sit in a `<tspan>` — which is exactly how the chrome bar is built, to colour each run — so
Safari renders the text on the baseline `y` and it sits ~5px high in a 46px bar while Chrome and
Firefox centre it. Measured on WebKit at 40px: `<tspan>` + `central` → **+0 offset**, identical to
no attribute at all; direct text content + `central` → +0.375em. Compute the baseline instead:

```js
const CAP_HALF = 0.355;   // half a cap height; holds for Geist, Inter, Menlo, Helvetica, Arial
const baselineAt = (centre, fontSize) => +(centre + fontSize * CAP_HALF).toFixed(2);
// <text y="${baselineAt(HEADER_H / 2, 12.5)}"> — no dominant-baseline, no alignment-baseline
```

This also matches what Blink computes to within ~0.2px, so removing the attribute does not move the
asset in the browser the design was reviewed in. Verify by measuring the cap box in a render: its
centre should land on the bar's centre — do not measure the ink box, descenders (`p`, `y`) hang
below the baseline by design and make it look low.

**Patterns over thousands of circles.** The original light banner emitted ~1200 explicit `<circle>`
dots (51KB). A `<pattern>` renders identically everywhere GitHub serves SVGs and lands at 10KB.

**Equal optical margins.** When the user asks to "centre everything", they usually mean equal gaps
to the frame, not a mathematical centre — measure node edge to border, not centre to centre.

## Content voice

Copy on brand assets stays factual and lowercase-mono for chrome: real node kind names
(`clone-repository`, `build-docker-image`, `deploy-compose`), the real install command
(`curl -fsSL https://nexploy.app/install.sh | sh`), real counts (56 node types, 10 categories).
Never invent a metric that the product can't back up.

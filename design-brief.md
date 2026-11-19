# Sippin’ Diesel

Private coffee journal for Tiago, Sam and Archie. React + Three.js, server-side shared password authentication, SQLite under /srv/private/apps/sippindiesel, HTTPS on sippindiesel.tiagolima.io. Installable Android PWA; Google Maps deep links; no search indexing. Names are personas, not independently authenticated accounts. Do not request the shared password in chat.

Reference: supplied Gyakuten Meets Jazz Soul artwork. Borrow creamy paper, tobacco brown, brass accents, poised asymmetry and a relaxed jazz atmosphere. Do not reproduce its characters or artwork.

Rating endpoints: “Piss” and “Coffee Excelence” (user's spelling retained until clarified). Mobile-first interaction, desktop equally considered. Motion with reduced-motion and non-WebGL fallbacks. No autoplay sound. Private content is never service-worker cached. Session cookies HTTP-only, same-site; password verified on server, rate limiting, CSRF/origin checks.

Open questions: individual drinks versus café-level reviews; photo uploads; concept selection; final password configured directly by user; encrypted volume unlock.

Concepts generated with python.secrets on 2026-11-19:
- The Listening Room: AfFBwe1cbI1Pm5Asj6NnSs5fqyMfzRPECSrN4yIbyLB3wEUIBGSPfi9XDZPqXgIkhETLdoHbfVv50pdMnMA7DbQgizOM6GBr4hrnh8pQKeYHa6sDE8ESnBsesw0Zi0gS
  Cream, coffee ink and aged brass. Oversized italic editorial serif, open asymmetric layout, glazed ceramic hero, fine ledger rows. Quiet drifting motion. Recommended closest to reference.
- After Hours: GfYnhkhYQKzVXXESfJUMhA4S1IfHkai7NuxXxqr4r7r6SYggDljk7FG1MNhCYCNnRTiHSIu54SvTvw1GLZ5hd4CF6g5iZERBMdelX15svf1JeSZgO6IMMBy8Tpke6h41
  Espresso-black and amber. Centred condensed typography, spotlighted cup, circular score dial and compact dark panels. Slower theatrical reveals.
- Field Notes: uWpGlb6n1waaLfsIXMVTASRyca1XZZfRmPKSE99EGIkOUQrpuwD21bpFSp1aX9HuzfiOYybtsHep4RdmxKGpcYZyRdXnyRGpIglbTxoJhDoyNORtliq3MWQMYoTdo9gw
  Rust, warm ivory and sage. Broad slab headings, notebook composition, tilted tasting slips, tactile line illustration and spring-like transitions.

Plan: render three comparable concepts using consistent app content; choose/refine; implement API, forms and PWA; test auth and persistence; inspect desktop/mobile; deploy into existing sandbox. Sites skill consulted for local preview only; hosting is explicitly the user's NixOS VPS, not Sites.

Asset search: tevy.dev/models/takeaway-coffee-cup (CC0, 218 KB GLB); polyhaven.com/a/comfy_cafe (CC0 lighting); poly.pizza/m/CdLx2Awq6U (CC0 cup). Inspect assets before adoption. Source files and licenses kept with final app.

Decisions: individual coffees grouped by café; photo uploads included. Use 10-point ratings to preserve the existing spreadsheet scores. Imported rows live in server/imported-reviews.json: four cafés, two reviews by Tiago, two unrated. No invented coffee types or years. Original wording retained. Google Drive connection abandoned on user's instruction; pasted rows are canonical. Work remains local; no deployment authorised during user's absence.

Critique round 1 (fresh agent): Listening Room 8/10, Field Notes 7.5, After Hours 7. Reduce returning-user hero; emphasise actual café grouping and photos; strengthen secondary contrast. Applied real review content and larger full-size typography; cup hero belongs on login/first visit in final app.

User selected Field Notes: retain terracotta notebook styling and slight tilts. Tone is self-deprecating with subtle visual humour. Exact hero quote: “Meet you by the piss door”. Requested motion: perpetual coffee pour with a swirling surface, respecting reduced motion.

Latest pours: user requested classy collectible-card parallax with coffee patterns. Implemented restrained mouse tilt (2–3 degrees), independently moving bean/ring linework and edge-only brass sheen. Opaque paper keeps text readable; touch and reduced-motion retain static notebook tilt.

Cup refinement: subtle animated three-arm crema swirl, scroll-activated coffee stream fading after scrolling, impact ripple. Rebuilt handle as an open curved tube with endpoints in the ceramic wall below the liquid surface. Reduced-motion disables pour/swirl movement; offscreen rendering pauses. Production build verified; visual inspection remains outstanding.

Liquid direction revised: remove pour and scroll coupling entirely. Continuous gentle crossing swells with slowly evolving coherent noise, small surface buckling and pinned edges; reduced motion stays still. Supersedes spiral and impact ripple treatments.

Scroll response restored on request: visible cup accumulates bounded scroll energy, increasing wave amplitude up to 4.5× idle and speed up to 2.8×; energy decays smoothly after scrolling. No pour stream. Reduced motion disables response.

Cup rotation now follows viewport-wide mouse position with frame-rate-independent easing. Leaving the browser or losing focus gently returns to neutral; touch and reduced motion do not rotate the cup.

Refinement: retained selected Field Notes identity. Replaced exposed native roast control with a bean-labelled trigger and parallax tasting panel; custom bean-shaped range thumb and four labelled roast stops. Added faint drafting border, notebook margin and sparse translucent coffee rings outside reading surfaces. Included in first VPS deployment.

Pixel character revision (built-in image generation): replaces 3D people with transparent full-body raster sprites on individual parallax cards. Shared prompt: genuine 16-bit pixel art, cute slightly deranged face, flat limited warm palette, clean square pixels and dark brown outlines, front-facing full-body pose, no text/props, transparent background. Tiago: bald, dark brown eyes, warm skin, terracotta shirt, dark trousers. Sam: thin, bald, blond eyebrows, pale skin, round glasses, brown turtleneck. Archie: bald, blue eyes, tiny square sage-green torso, exaggerated long limbs. Tiago refinement requested removal of background/glow and flatter colours. Saved in public/assets/characters/{tiago,sam,archie}.png. Original generator alpha preserved.

Coffee decoration: built-in image generation produced transparent 16-bit espresso/saucer, three-bean cluster and thin scruffy orange stray cat (lying horizontally, nicked ear, uneven whiskers, sleepy face). Flat warm palette, hard pixel outline, no text or scene. Assets: public/assets/coffee/{espresso,beans,stray-cat}.png. Cat perch uses a gentle stepped pour/wake loop, disabled for reduced motion. Character cards get stable per-mount random tilt ±2.5° and offset ±6px. Character and roast panels use 58% paper with backdrop blur. Sheen is dimmed and tracks pointer X/Y instead of pinning to the top edge.

Static cat revision: generated a single low-detail 16-bit emblem with scruffy orange stray lying belly-up, existential stare, wooden ledge, and cream hanging banner reading “QUESTIONABLE TASTE.” / “STRONG OPINIONS.” Flat warm palette and transparent background; no cup, pour, glow or motion. File: public/assets/coffee/cat-banner.png. Entire emblem has the former sign’s four-degree tilt. Removed character-card coffee stickers; occasional small beans remain only at reviewed café-card corners.

Follow-up: simplify cat emblem further to an 8-bit look with a coarse pixel grid, limited flat colours, clearly visible dark triangular nose, belly-up existential expression and unchanged banner wording. Remove all cat animation and pour. Remove all coffee accents from character cards; show one small corner accent only on occasional reviewed café cards.

Latest decisions: return cat to simplified 16-bit style, with visible nose and readable small banner. Five coffee beans represent unchanged scores out of ten, each half-bean one point; original 8/10 and 7/10 remain unchanged. Six corner accents available: beans, espresso, moka pot, pour-over filter, coffee bag, croissant. New four assets generated with coarse-pixel low-detail warm palette and transparent backgrounds for small-size readability. Accent selection is stable per café and remains sparse. Maps preview research pending source choice; retain accurate Google Maps deep links in the meantime.

Cat palette refinement via built-in image edit: recolour only to dusty terracotta #a97459, taupe #ad9277, parchment #e7ddc8, espresso outline #574337 and walnut ledge #83644e. Preserve pose, pixel grid, nose, silhouette, transparent background and banner wording. Reduce saturation so the emblem sits within Field Notes rather than competing with it.

Rating refinement: native slider in 0.5-point increments from 1–10 progressively fills five beans. Live self-deprecating verdicts replace endpoint explanations; 8.5 = “Might write a poem about it”. API validates half-point increments; persistence test includes 8.5 and rejects 8.25. Cat image edit preserves muted palette and banner, adds open mouth, dangling front leg and stronger existential stare, removes extra neck paw; exactly four legs.

### Local pixel map prototype
Static OpenFreeMap/OpenMapTiles geometry for verified Rosslyn and Arôme locations, themed canvas rendering without WebGL or idle animation. Attribution retained; Google Maps click-through. Other cafés retain their existing link until coordinates are verified. Local-only prototype, not deployed.

### Server-cached map release
Missing maps resolve on journal load and persist in encrypted SQLite. Ambiguous branches present location choices; unresolved cafés keep the Maps link. Preserve the approved 1.6× zoom, map icon, palette and static canvas performance.

### Small member portraits
Transparent 24px pixel heads derived with imagegen from the existing full-body characters. Palette reduced to 16 colours, no dithering; displayed statically at native resolution beside review authors, the current member and the hero roster. Original character cards stay unchanged.

### Approved tiny portraits, second pass
Redrawn with built-in imagegen as genuinely low-detail heads: solid beard for Tiago, glasses/blond eyebrows for Sam, blue eyes for Archie. User approved the actual-size comparison and requested white eye areas while preserving brown/blue pupils. Final transparent PNGs are 24 × 24, exported with nearest-neighbour pixel alignment checked to retain both pupils. No extra facial marks or animations.

### Native 16px release
Hand-drawn 16 × 16 pixel grids replace reduced generated portraits. Render at exactly 16 CSS pixels. Sam has open lower glasses rims and a bare chin; Archie has level eyes, a straight mouth and a two-pixel central toothbrush moustache. His full-body character receives the same narrow moustache via imagegen. Editable pixel grids are in scripts/member-portraits.json.

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

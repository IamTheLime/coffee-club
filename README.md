# Sippin’ Diesel

Private React / Three.js coffee journal for Tiago, Sam and Archie. SQLite stores reviews, photos and sessions. Field Notes is the selected design; `?concept=1`, `2`, `3` retain the original studies.

## Run locally

Requires Node 22.13+ with `node:sqlite` (verified on Node 26), npm and Sharp’s supported native platform.

```sh
npm ci
npm run setup
npm start
# In another terminal:
npm run dev
```

Open http://127.0.0.1:5177. Setup prints a generated local club password once and writes only its scrypt hash to `.env.local` (mode 0600). Save the password in your password manager. Setup refuses to overwrite existing settings. Choose any of the three names to log in. The shared password does not independently verify identity.

`npm run build` makes the production frontend. `npm test` runs five integration tests covering authentication, CSRF, import idempotency, persistence, photos, validation, edit ownership, logout and throttling. Tests need permission to listen on loopback.

## Data

Local database: `.data/coffee.sqlite` (plus SQLite WAL/SHM files). This local file is not application-encrypted. Production must point `DATABASE_PATH` to the app directory on the unlocked LUKS volume. Photos are re-encoded to JPEG with metadata stripped and stored in the same database. Use SQLite’s backup API or stop the process before copying the database; do not copy only the main file while WAL writes are active.

Four cafés and two Tiago reviews import once from `server/imported-reviews.json`. Original notes, scores and ambiguous day/month text are retained; no drink, year or photo was invented. Editing an imported entry requires filling its missing drink and date.

## Production settings (not deployed)

Build, then run `node server/start.mjs` with `NODE_ENV=production`, `APP_ORIGIN=https://sippindiesel.tiagolima.io`, a new production `PASSWORD_HASH`, `DATABASE_PATH` on the encrypted app volume, `HOST=127.0.0.1`, and `PORT=3001`. Supply settings through a protected systemd environment file, not Git. Caddy proxies to port 3001. Bind startup to the unlocked volume and run as the dedicated app user. No PostgreSQL is needed for this app.

Every API route and photo requires an HttpOnly session cookie. Writes check Origin; login attempts are throttled. All routes set noindex headers, with robots.txt and HTML noindex as additional indexing controls. The public frontend shell contains no private reviews. A shared password means anyone in the club can choose any persona; use individual credentials if stronger author identity becomes necessary.

The manifest, 192/512px icons and network-only service worker support Android installation over HTTPS (localhost is supported for development). Android device installation has not yet been tested. Offline mode shows a reconnect page; private content is never saved by the service worker. No analytics or external fonts are used.

## Visual assets

Cup, saucer, spoon, liquid and card patterns are procedural, editable source. Cormorant Garamond and Manrope fonts are locally hosted; original Google Fonts stylesheet is in public/assets/fonts-source.css. Unused candidate takeaway model from https://tevy.dev/models/takeaway-coffee-cup/v1/lod0.glb is CC0 and is not used by the app. The jazz reference is inspiration only and is not distributed as an app asset.

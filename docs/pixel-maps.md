# Local map prototype

OpenFreeMap vector tiles, snapshot 20261115_080022_pt, zoom 14. Data © OpenStreetMap contributors, schema © OpenMapTiles. Attribution is visible below each map. Geometry is a derived OSM data extract, under ODbL: https://www.openstreetmap.org/copyright . Keep this notice when distributing the extract.

Verified with Nominatim address results:
- Rosslyn, 78 Queen Victoria Street: 51.5125832, -0.0934321.
- Arôme Bakery, 9 Mercer Street: 51.5129927, -0.1261416.

Canal No 5 and The Roasting Shed still use ordinary Google Maps links; do not substitute approximate geocoding matches for exact café positions.

Map previews use Canvas 2D at 320 × 196, redrawn on roast changes only. No additional WebGL renderer, animation loop, third-party browser requests, or runtime dependencies. Café geometry is currently bundled with the app. This is a local design prototype, not a deployed generic map service for newly added cafés.

Provider terms: https://openfreemap.org/tos/ . Offline downloads must stay within 3,000 tiles or 50 MB, at most four simultaneous requests, with an identifying User-Agent. This prototype fetched a few tiles sequentially. Service is free without uptime guarantees. Standard OSM raster tiles have different rules; do not replace the source with tile.openstreetmap.org for bulk/offline downloads.

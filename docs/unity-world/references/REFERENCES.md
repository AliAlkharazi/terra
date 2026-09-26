# Clash of Clans / Projection Reference Index

Local copies for Terra World art direction. Prefer studying **village presentation** (camera, buildings, UI chrome, ambient life)—not combat.

| File | Source URL | What to study |
|------|------------|---------------|
| `01_gdc2015_coc_designing_games_talk.jpg` | https://commons.wikimedia.org/wiki/File:Clash_of_Clans-_Designing_Games_That_People_Will_Play_For_Years_(16119522833).jpg (via Special:FilePath) | GDC 2015 stage photo (Official GDC / CC). Context for how Supercell presents CoC publicly; not an in-game shot—use as brand/history cue only. |
| `02_gdc2015_coc_designing_games_talk_alt.jpg` | https://commons.wikimedia.org/wiki/File:Clash_of_Clans-_Designing_Games_That_People_Will_Play_For_Years_(16532202257).jpg | Alternate GDC 2015 angle of the same talk. |
| `03_axonometric_projection_comparison.png` | https://commons.wikimedia.org/wiki/File:Graphical_projection_comparison.png | Axonometric vs perspective families. Map CoC’s “isometric-like” look to dimetric/oblique axonometric; informs Unity ortho vs perspective choice. |
| `04_isometric_cube.svg` | https://commons.wikimedia.org/wiki/File:Isometric.svg | Clean isometric cube diagram for explaining equal-measure axes to art/engineering. |
| `05_appstore_ipad_village_ambient.jpg` | Apple App Store CDN (iTunes lookup id=529479190) — iPad screenshot `COC_enUS_Progression_Update2026V3_SS2…` | High-res village / progression marketing shot: scenery depth, ambient props, building density at overview zoom. |
| `06_appstore_village_overview_1.jpg` | App Store iPhone screenshot `clash_2208x1242_1` | Primary village overview: high camera, green ground tiles, Town Hall hierarchy, UI chrome corners. |
| `07_appstore_village_buildings_2.jpg` | App Store iPhone screenshot `clash_2208x1242_2` | Building silhouettes, roof readability, color coding of structure types. |
| `08_appstore_village_ui_3.jpg` | App Store iPhone screenshot `clash_2208x1242_3` | HUD overlays vs world: resource bars, buttons, how UI floats over village without cluttering tiles. |
| `09_appstore_village_layout_4.jpg` | App Store iPhone screenshot `clash_2208x1242_4` | Layout / grid feel, pathing between buildings, walls as soft boundaries (Terra: district borders, not combat walls). |
| `10_appstore_clan_social_5.jpg` | App Store iPhone screenshot `clash_2208x1242_5` | Social / clan presentation analog → Terra optional Campus hub (non-combat). |
| `11_appstore_ipad_village_classic.jpg` | App Store iPad screenshot `COC_enUS_V1_SS1_iOS_13_2732x2048` | Classic scenery framing: waterfall/cliffs backdrop, beach edge, village island composition. |
| `12_appstore_ipad_progression_village.jpg` | App Store iPad screenshot `COC_enUS_Progression_Update2026V3_SS1…` | Modern progression marketing art: richer materials, lighting, building LODs at mid zoom. |

## Primary App Store listing

- https://apps.apple.com/us/app/clash-of-clans/id529479190  
- Screenshot URLs resolved via `https://itunes.apple.com/lookup?id=529479190&country=us` (mzstatic CDN).

## Written sources used for the plan

| Topic | URL |
|-------|-----|
| CoC projection / 4:3 tiles / ~47.5° ortho pitch | https://gamedev.stackexchange.com/questions/95798/what-is-clash-of-clans-projection-called |
| Making of CoC — high camera, pre-rendered 3D, playability | https://www.pocketgamer.biz/chart-rush-making-of-clash-of-clans/ |
| Art sweet spot (Pixar + Capcom), tablet UX | https://www.gamedeveloper.com/business/-i-clash-of-clans-i-5-keys-to-success |
| Scenery / seasonal / ambient animation overview | https://gamingonphone.com/guides/clash-of-clans-complete-list-of-home-village-scenery-released-in-2024/ |
| Wikipedia overview (buildings hierarchy, Town Hall) | https://en.wikipedia.org/wiki/Clash_of_Clans |
| Wikimedia category | https://commons.wikimedia.org/wiki/Category:Clash_of_Clans |

## Could not obtain cleanly

| Attempt | Reason |
|---------|--------|
| MobyGames “Constructing a village” screenshot | Cloudflare challenge (HTTP 403) on mobygames.com |
| clashofclans.fandom.com Scenery page | HTTP 403 from fetch provider |
| Supercell Fan Kit direct asset files | Requires authenticated Fan Kit session; no public direct CDN dump used |
| Extra Wikimedia projection diagrams (several Special:FilePath names) | 404 for guessed filenames; `Graphical_projection_comparison.png` + `Isometric.svg` sufficient |

## License / usage note

Reference images are for **internal product design research** for Terra. App Store and Supercell marketing art remain copyrighted by Apple/Supercell; Wikimedia files follow their stated licenses (GDC photos CC-licensed; diagrams typically CC/public domain per Commons). Do not redistribute marketing screenshots as Terra brand assets.

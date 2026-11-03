# Lawn Kid: brief review and art pass

**Current implementation:** the later two-style release supersedes the character treatment below. See [ART_STYLES.md](ART_STYLES.md) for the playable Fine Pixel and Textured Realism modes, saved settings and current validation.

Reference: `brief.md`. Direction clarified during review: **backyard lawns**, a neighborhood kid earning pocket money, and relaxed summer afternoons. Keep the existing grass and flower artwork.

## What is implemented

| Brief requirement | Current implementation | Review |
| --- | --- | --- |
| Playable mowing loop | Movement, collision, mowing, hazards, job completion, results, money, shopping and saves | Present in `sim.js` and `main.js`. Automated playthroughs exercise the simulation, not manual input or save/reload. |
| Ten different lawns | Ten builders with different sizes, outlines, obstacles and routes | All pass reachability, spawn and entity placement checks. |
| Scythe through riding mower | Scythe, reel, gas, ride; width, power, acceleration, turning, stamina/fuel | All four implemented. Their existing gameplay values were preserved. |
| Quality-based pay | Coverage 50%, stripes 18%, care 17%, speed 15%; damage deductions and discovery bonuses | Present. Bot results show that high coverage alone does not ensure positive pay. |
| Increasing depth | Thick grass, tools, six upgrade tracks, sprinklers, flowers, rocks, toys, hidden gnomes | Present. |
| Soothing music and mowing sounds | Synthesized pads, plucks, birds, ambience and tool sounds | Audio smoke test passes; this review did not include a subjective listening test. |
| Local app and friend-hosted alpha | Existing Mac app launcher; classic scripts and static HTML, no build step | Launcher points to this folder's `index.html`. No deployment was changed. |
| Fresh visual perspective and verification tools | Existing level/bot/audio tools plus the new art studio and perimeter tests | See below. |

## Art changes

- **Kid:** smaller, lighter silhouette; blue cloth baseball cap, faded striped terracotta T-shirt, denim shorts, socks and canvas shoes. Directional face and cap, walking bounce, idle movement, scythe swing, tired and stalled poses work through the existing player sprite API.
- **Tools and truck:** reduced saturation and specular highlights; washed metal, muted enamel and ochre tie them to the kid and the natural scenery.
- **Fences:** trace real lawn boundaries and merge straight spans, replacing repeated front-facing fence squares. Weathered cedar rails, restrained pickets, shaded posts and visible top caps. Side runs follow the lawn; paved entrances stay open. Existing hedge boundaries remain hedges.
- **Paths:** broad, flat, worn concrete / limestone paving, narrow earthy joints, mineral flecks and occasional hairline cracks. Grass edging appears only on exposed sides, not between adjacent path tiles.
- **Grass and flowers:** their drawing code and palettes are preserved. Collision maps, lawn layout, progression, saves and scoring are unchanged.

The reference to RollerCoaster Tycoon is interpreted as a readable elevated view with material detail and small neighborhood scenery. This remains a smooth Canvas game, rather than a switch to an isometric pixel-art engine.

## Evidence and limitations

- `node tools/check-levels.js`: all ten levels pass.
- `node tools/art-check.js`: all ten levels pass; verifies exact perimeter coverage, no overlapping spans, path-neighbor masks and unchanged collision data.
- `node tools/audio-smoke.js`: passes (676 mock nodes).
- JavaScript syntax checks pass for the changed runtime files.
- Browser renderer smoke check passes: **40 lawn/tool scenes rendered**, confirmed in `shots/art-review/studio-final.png`.
- Captured actual headless Chrome gameplay: first lawn, reel mower in motion after 20 simulated seconds, riding mower in the larger tree-filled lawn, and a narrow window. A headless narrow-window capture is not a substitute for testing on a touch device.
- All 40 existing simulation bot runs were recorded in `shots/art-review/playtest.txt`. Many report **STUCK**; the bot often cuts flowers, hits rocks and makes repeated refuelling trips. These results identify a bot/balance validation gap; they do not prove that human players cannot complete those lawns. Do not use this bot as a passing end-to-end acceptance test yet.
- Browser UI control was unavailable in this session. Keyboard, touch, save/reload and subjective audio quality still need a manual play session.
- The later existing levels include an orchard, country club and mansion. If every job should remain strictly a residential backyard, those builders and their job copy merit a separate level-design pass.

## Review tools

Open `mockups/art-review.html` for the live art studio: switch among all ten lawns, all four tools and a cut-grass slider; inspect the kid in eight directions and pause animation. It uses the game's real renderer, so it stays current as art changes.

`node tools/art-check.js` validates boundary geometry. `tools/shot.sh` now exits on screenshot failures rather than printing a misleading success path, and accepts a fifth argument for a different local preview page. Example:

```sh
bash tools/shot.sh 'still=1' shots/art-review/character-tools.png 1440x1640 200 mockups/art-review.html
```

The existing local app opens the updated game directly; close and reopen its window to refresh the art.

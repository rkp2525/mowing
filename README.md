# Lawn Kid 🌱

A cozy top-down lawn mowing game. Start as a kid with a scythe, earn cash by the *quality* of your mowing, and work up to a riding mower across 10 neighborhood lawns.

## Play
- **Desktop app:** double-click `Lawn Kid.app` (opens in its own window via Chrome; falls back to your default browser). Or just open `index.html`.
- **Phone / friends:** deploy this folder to Vercel (`npx vercel --prod`) — it is a plain static site, no build step.
- Controls: WASD/arrows or hold the right mouse button to move (taps nudge, holding ramps up; **Alt** = creep) · **Shift / L / ↔ button = straight-line lock** for perfect stripes · Mouse = aim freely through 360°; click or tap Space = one scythe swing; J/K = rotate aim without a mouse · Q/E switch tool · +/− zoom · Esc pause. Touch: drag to move, use the AIM pad to face any direction, tap SWING once per cut. A dashed outline previews the sweep and turns warm red when flowers are in danger. Walking and holding a button never trigger repeated scythe swings.

## Game layers (the foundation for a bigger game)
- **Tools:** scythe → reel mower → gas mower → riding mower (speed, width, power, turn radius, fuel).
- **Quality pay:** coverage, stripe pattern, care (flowers/rocks/gnomes/toys), speed vs par.
- **Upgrades:** blades, boots (stamina/speed), fuel tank, steering, eagle eyes, business cards.
- **Hazards/secrets:** thick grass, rocks, flowers, sprinklers, hidden gnomes, toys, trees, ponds, hedges.

## Code map
| file | role |
|---|---|
| `js/data.js` | tools, upgrades, **level builders** (add a lawn = add a `L.push({...build(B){…}})`) |
| `js/sim.js` | pure simulation: movement, cutting, hazards, scoring (DOM-free, runs in Node) |
| `js/render.js` | native-resolution renderer: cached hand-drawn blade tiles + vector sprites + particles |
| `js/audio.js` | fully synthesized soundtrack + SFX (Web Audio, no assets) |
| `js/main.js` | loop, input, camera, HUD, all screens, save (localStorage) |
| `js/bot.js` | mowing bot (balance tests + dev demos) |

## Dev tooling (`tools/`)
- `node tools/check-levels.js [--map N]` — validates every lawn (reachability, entities in walls) and prints ASCII maps.
- `node tools/playtest.js [level] [tool]` — headless bot playthroughs for balance numbers.
- `node tools/audio-smoke.js` — mock-AudioContext smoke test of every sound.
- `tools/shot.sh "<query>" out.png [WxH]` — headless Chrome screenshot. Dev URL params: `level=N&tool=ride&warp=60` (fast-forward with the bot), `auto=1` (bot plays), `screen=board|shop|brief|results`, `zoom=N`, `up=N` (all upgrades), `shot=1` (hide hints).

## Art review

The backyard art pass uses a neighborhood kid in faded summer clothes, connected weathered cedar fences, and worn paving, retaining the existing grass and flowers. See [ART_REVIEW.md](ART_REVIEW.md) for the brief audit and validation limits.

- Open [the live art studio](mockups/art-review.html) to inspect all ten lawns and every tool/direction.
- `node tools/art-check.js` checks fence coverage, paving edges and preserved collision maps.
- `tools/shot.sh "<query>" out.png [WxH] [virtual-ms] [local-page]` can also capture a preview page.

## Character exploration and precision controls

Open [the ten-style character gallery](mockups/character-styles.html) for the latest concepts, each with a matching truck. The selected Fine Pixel and Textured Realism directions are now implemented with separate production sprites and a saved art-style setting.

`node tools/check-controls.js` checks manual swings, continuous aiming, independent movement, immediate stopping, committed swing direction, and flower damage boundaries. The scythe now has a shorter reach and narrower sweep for edging. Job times and payouts may need tuning after a human playtest with the new controls.

## Two playable art styles

Choose **Settings → Choose your art style** for Fine Pixel (the original scenery with new pixel characters and equipment) or Textured Realism (a newly built world). Progress is shared and the choice is remembered.

[Compare both live renderers](mockups/two-styles.html) · [Art implementation and checks](ART_STYLES.md).

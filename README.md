# Lawn Kid 🌱

A cozy top-down lawn mowing game. Start as a kid with a free, quiet reel mower, earn cash by the *quality* of your mowing, and work up to a riding mower across 10 neighborhood lawns.

## Play
- **Desktop app:** double-click `Lawn Kid.app` (opens in its own window via Chrome; falls back to your default browser). Or just open `index.html`.
- **Phone / friends:** deploy this folder to Vercel (`npx vercel --prod`) — it is a plain static site, no build step.
- Controls: WASD/arrows or hold the left mouse button to steer · **Alt** = creep · **Shift / L / ↔ button = straight-line lock** · Q/E change equipment at the truck · Space scatters fertilizer · +/− zoom · Esc pause. Touch: drag to steer. Mowers cut as you move.

## Game layers (the foundation for a bigger game)
- **Tools:** free reel mower → gas mower → riding mower (speed, width, power, turn radius, fuel).
- **Quality pay:** coverage, stripe pattern, care (flowers/gnomes/toys), speed vs par.
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

`node tools/check-mowing.js` checks partial flower clipping, persistent damage, proportional scoring, neutral rock collisions, and starter equipment migration. The old scythe/trimmer simulation and art remain dormant for future experiments; they are excluded from playable equipment. Job times and payouts may need tuning after a human playtest with the reel mower start.

## Two playable art styles

Choose **Settings → Choose your art style** for Fine Pixel (the original scenery with new pixel characters and equipment) or Textured Realism (a newly built world). Progress is shared and the choice is remembered.

[Compare both live renderers](mockups/two-styles.html) · [Art implementation and checks](ART_STYLES.md).

## Gentle mowing

Each flower patch has 21 independently clippable stems, shared by both art styles and the blade collision geometry. Clipped stems stay clipped for that job; revisiting the same stems adds no damage. Care and cash deductions use the fraction of each patch clipped (21 stems = one flower equivalent). Cash deductions are rounded to whole dollars at job completion. Replaying a job restores the flowers.

Rocks are solid round obstacles with no bounce, steering change, stall, extra fuel cost, care loss, or cash deduction. Existing saves retain progress and purchased mowers, receive the reel mower, and switch away from retired equipment automatically.

Mown grass uses consistent green shades by travel direction: north/east are lighter, south/west are darker. Each mowing sample remembers its direction, so opposite passes create stripes and re-crossing a stripe only bends blades beneath the deck. Re-crossing cut grass does not add coverage or pattern points.

During a job, mower changes require returning to the truck (the same area used for refueling). A change is refused if the new mower would overlap a rock, tree, wall, or other solid obstacle; the current mower and saved selection remain unchanged.

## Groundskeeping

Every lawn includes two to five rough patches with pale grass and exposed soil. Mow a patch, return to the truck, click the equipment chip, and choose **Fertilizer**. Walk to the patch and press **Space** or tap **Scatter** once per handful. Holding the button never repeats the action. A soft circle previews the area around your feet; move across the patch to cover it.

Fertilizer and refills are free. Only mown, untreated rough grass within reach receives feed; healthy lawn and flowers are unaffected. Fed grass greens up over five seconds. The HUD tracks feeding, and treatment earns a proportional bonus of up to 10% of the job's base rate. Groundskeeping is optional. The speed-rating clock freezes when the lawn reaches 97% mowed, so feeding afterward does not lower the mowing score. New jobs restore the original rough patches.

`node tools/check-groundskeeping.js` checks patch placement across all ten lawns, truck-only equipment changes, manual local spreading, mowing requirements, growth, and flower safety. `tools/gentle-review.html` compares flowers, stripes, and rough-patch restoration in both production renderers.

# Lawn Kid 🌱

A cozy top-down lawn mowing game. Start as a kid with a free, quiet reel mower, earn cash by the *quality* of your mowing, and work up to a riding mower across 10 neighborhood lawns.

## Play
- **Desktop app:** double-click `Lawn Kid.app` (opens in its own window via Chrome; falls back to your default browser). Or just open `index.html`.
- **Phone / friends:** deploy this folder to Vercel (`npx vercel --prod`) — it is a plain static site, no build step.
- Controls: WASD/arrows or hold the left mouse button to steer · **Alt** = creep · **hold Shift = Precision mode** · **L / ↔ = straight-line lock** · Q/E change equipment at the truck · Space scatters fertilizer · +/− zoom · Esc pause. Touch: drag to steer. Mowers cut as you move.

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

`node tools/check-mowing.js` checks partial flower clipping, persistent damage, proportional scoring, neutral rock collisions, and starter equipment migration. The scythe remains dormant; the Precision Trimmer is available separately at the truck for manual edging. Job times and payouts may need tuning after a human playtest with the reel mower start.

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

## Player feedback

Use **Feedback** and **Log** in the bottom-left corner, including while the truck menu, pause screen, or results are open. Feedback captures the visible lawn and UI before opening a note dialog. Choose a category, write a note, and save it (or press Command/Ctrl+Enter). Closing feedback restores the previous screen and focus. Mower movement, game time, camera, particles, and grass stay frozen while capturing, writing, or reviewing feedback; controls resume with held inputs released.

The Log groups notes into sessions and opens the most recent session with its entries selected. Sessions persist across reloads; a new session starts after 30 minutes without a saved note, or with **Start new session**. Uncheck anything you do not want to share, then choose **Download selected** to export one chronological JSON bundle. Each entry shows the lawn, equipment, game screen, art style, category, and capture time. Reports contain an embedded PNG when available, portable simulation arrays (including flower clipping and patch treatment), progress, camera/viewport details, and the note.

**Delete selected** and **Delete entry** move notes to Trash. Undo and Restore recover them; deleted notes stay out of exports. Downloads keep the original notes in Log. Collecting or exporting feedback does not approve or trigger game changes.

Reports live in the separate `lawnkid-feedback` IndexedDB database on this browser, not in the game-progress save. There is no upload or feedback server. Browser-data clearing removes local reports, so download ones you want to keep. If storage fails, your draft remains open with **Download instead** available. If a screenshot cannot be captured, you can still save or download the note and context; the dialog states that the image is missing. Direct `file://` pages may restrict canvas screenshots; the desktop app serves the game locally and supports full capture.

Capture includes game menus and scrolling, excludes Feedback/Log controls and transient toasts, and needs no screen-sharing prompt or external capture library. Already loaded game assets support offline capture. Browser chrome is excluded; web fonts and browser-specific effects may render slightly differently.

- `node tools/check-feedback.js` — session/export logic and portable Mowing snapshots.
- `node tools/feedback-playtest.mjs` — isolated Chrome acceptance checks at desktop and phone widths: capture image content, frozen active mowing, menus, persistence, sessions, selected downloads, Trash/Undo/Restore, offline capture, and failure recovery. It starts a temporary local server and prints the location of screenshots and exported test reports. Requires Google Chrome on macOS; no npm dependencies.

## Forgiving steering

**Easy steering** is on by default: all mowers turn directly toward the input and stop immediately when movement is released. Small deviations near horizontal or vertical are gently straightened; deliberate diagonal passes remain possible. Press **L** or use **↔** for a strict straight-line lock. Hold **Shift** for Precision mode instead; it temporarily bypasses line lock and angle snapping. Steady Hands upgrades strengthen line assist and also improve turning in the optional smooth-steering mode.

Open **Pause → Settings** during a job to adjust steering, sound, or art style. Done returns to the paused job. Turning Easy steering off restores the gradual-turning controls. Settings persist across sessions and apply to the current lawn.

## Precision trimming

Return to the truck and choose **Precision Trimmer** for narrow corners and edges. Walk into position, face the edge, then press **Space** or tap **Trim** once for each snip. It cuts a half-cell-wide patch ahead of you, anchored where the snip starts; walking or holding the button does not repeat cuts. It is free, uses no fuel or stamina, and follows the same partial flower clipping rules. Return to the truck to put it away. The scythe remains retired.

## Precision mode

Hold **Shift** while using a mower or the Precision Trimmer. Movement slows to **30%** of that tool's normal speed, and **A/D** or **left/right** slowly pivot the equipment through the full 360 degrees. **W/S** or **up/down** move forward/backward along the chosen angle. Combine them for a gradual curve. There is no angle snapping in Precision mode; releasing movement stops immediately. Pointer or touch steering first pivots toward the target, then advances. Releasing Shift returns to the normal controls. The 🎯 button provides the same hold-to-use mode on screen, including on touch devices; releasing or canceling it exits the mode.

The **Precision mode · 30% speed** indicator confirms the mode is active. A short shaded strip directly ahead of the blade shows its full cutting width for the next small forward movement. It rotates with the equipment, stops at obstacles, and turns amber when intact flower stems lie in that short path. It has no long aiming line. Pivoting in place with a mower does not cut grass; lining up is safe. Reverse passes record the actual travel direction for stripes, and very slow reel-mower nudges still cut. Trimmer cuts remain manual.

Precision mode is temporary, so it is not stored as a preference. Pausing, changing equipment, losing focus, or opening feedback releases the on-screen hold. **L / ↔** remains the separate normal-mode line lock. Fertilizer keeps its usual walking and Scatter controls.

`node tools/check-precision.js` covers full-circle pivoting at three frame rates, 30% speed, forward/back travel, stopping, precise reel cuts, pointer alignment, blade-path geometry, obstacles, flower warnings, and tool behavior. The browser checks also cover Shift routing, line-lock bypass, and touch hold/cancel.

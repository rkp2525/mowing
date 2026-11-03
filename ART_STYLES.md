# Fine Pixel and Textured Realism

Both styles are implemented in the playable game. Choose **Settings → Choose your art style**. The choice is saved with the existing player profile; money, job results, tools and upgrades are shared.

- **Fine Pixel** is the default. It keeps the approved grass, flowers, paving and cedar fences, with the selected teal-shirt pixel character, a white/olive utility truck and new mowing equipment.
- **Textured Realism** has an independent renderer and new assets for the character, truck, equipment, uncut and mowed lawns, concrete paving, house materials, water, hedges, trees, rocks and flowers. Its cedar fences and small props are newly drawn in that renderer.

`mockups/two-styles.html` compares both real renderers with the same lawn and cut pattern. `mockups/art-review.html` supports both styles, every lawn, all four tools, and a directional pose sheet.

## Rendering and input

`js/art-styles.js` owns style-specific asset loading, animation and the realism renderer. `js/render.js` retains the established Fine Pixel scenery and delegates the new character/equipment/truck. The realism renderer does not call the old landscape drawing functions. Shared overlays provide accurate cutting guides and gameplay feedback in both styles.

Each character has 8 facings and 4 pose rows (idle, two walking frames, seated). Aiming and the scythe operate continuously through 360 degrees; the sprite facing follows the nearest available direction. Mower handles are drawn to the character's hands rather than using the atlas handle placement. Rider positioning is corrected for the seat.

Walking does not swing. Click, Space or the touch SWING button triggers one swing per press; holding does not repeat. Mouse, J/K or the touch AIM pad controls facing independently of movement. The committed swing direction stays fixed until that swing finishes. The original scythe's oversized reach and broad hit arc were reduced in the preceding precision-control pass. Human playtesting is still needed to tune job times around that smaller manual sweep.

The styles do not change collision geometry, scoring, tools, level layout or simulation behavior. Both use the same audio and interface.

## Assets

Production PNGs live in `assets/art/`. They were generated with the built-in image-generation tool from the two selected concept sheets. `assets/art/manifest.json` records the exact prompts and references. Character atlases received a separate background-extraction pass to remove the visible white haze; the final assets have transparent backgrounds. Art packs load on demand and a rapid selection change cannot let an older load overwrite the latest choice.

The original concept gallery remains at `mockups/character-styles.html`; those concept illustrations are not used as gameplay sprites.

## Validation

- `node tools/check-controls.js`: manual press/release, no automatic cutting, arbitrary-angle aiming, independent movement, immediate stop, committed swing and flower damage boundaries.
- `node tools/art-check.js`: all 10 collision maps, fence boundaries and paving edge masks.
- `node tools/check-levels.js`: all 10 levels are reachable, with valid spawns and placements.
- `node tools/audio-smoke.js`: audio API smoke test.
- Local browser control check: `tools/control-browser.html?level=1&shot=1&controlcheck=1` exercises the actual keyboard and pointer input handlers.
- Local browser style check: `tools/style-browser.html` changes the setting through the real UI, verifies saved preferences after reload, preserves money/stars/upgrades, and renders all **80** combinations of 10 levels × 4 tools × 2 styles without altering simulation state. Its temporary save fixture is restored afterward.
- Actual Chrome screenshots were inspected for both worlds, all character directions, mower grips, seated riders, and the settings screen.

The automated tests do not substitute for a touch-device play session or subjective audio review. The earlier mowing bot still has known pathfinding and flower-avoidance limitations; it is not a human-playability acceptance test.

## Development

Dev game URLs accept `?level=1&art=pixel` or `?level=1&art=realism`. These query overrides do not write player progress or preferences. Use the normal game Settings to persist a choice.

Example captures:

```sh
bash tools/shot.sh '' shots/art-review/two-styles.png 1440x1920 2500 mockups/two-styles.html
bash tools/shot.sh '' shots/art-review/style-settings-test.png 1280x1000 7000 tools/style-browser.html
```

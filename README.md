# Stack Tower

A Ketchapp-"Stack"-style tower builder in Three.js. Drop each block onto the one
below; whatever hangs over the edge breaks off and falls, and the tower gets
narrower as you go.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

## Layout

```
src/
  main.js            wiring + game loop; owns the run lifecycle
  core/
    SceneSetup.js    renderer, orthographic camera, lights, backdrop themes
    CameraRig.js     height follow
  game/
    Tower.js         stack state + computePlacement() — the overlap rules, pure
    Block.js         geometry/material recipes, palette walk, target outline
    Debris.js        trimmed pieces: gravity + tumble + fade
    Difficulty.js    speed / tolerance / tier curves
    Scoring.js       score, combo, coins earned this run
    GameState.js     menu | playing | over | shop
  systems/
    Storage.js       versioned localStorage schema
    Economy.js       coins, ownership, equipped cosmetics
    Audio.js         WebAudio synth — no asset files
    Input.js         pointer / touch / space -> one drop signal
  data/
    skins.js         block skins (palette + material recipe)
    backgrounds.js   backdrop themes (gradient stops + lighting)
  ui/                DOM overlays: HUD, menu, shop, game over
```

`Tower.computePlacement()` is a pure function with no Three.js in it, so the
placement rules can be tested without a canvas.

## Tuning

Everything that scales with height is in `game/Difficulty.js`:

| Knob                                              | Meaning                                                  |
| ------------------------------------------------- | -------------------------------------------------------- |
| `baseSpeed`, `speedGrowth`, `maxSpeed`            | `speed = base + growth × ln(1 + height)`, capped         |
| `baseTolerance`, `toleranceDecay`, `minTolerance` | how wide the "perfect" window is, tightening with height |
| `maxCoinMultiplier`                               | coin multiplier ceiling (1 per tier of 10 blocks)        |

Block-size rules live in `game/Tower.js`: `BASE_SIZE`, `MIN_SIZE` (below this the
run ends), `WARN_SIZE` (the "width critical" HUD warning), `TRAVEL`.

Perfect-streak rewards are in `game/Scoring.js`: `PERFECT_STREAK_BONUS_AT` (coin bonus).

## Save data

One `localStorage` key, `stacktower.save`:

```json
{
	"schemaVersion": 1,
	"highScore": 0,
	"coins": 0,
	"owned": { "skins": [], "backgrounds": [] },
	"equipped": { "skin": "sunset", "background": "sunset" },
	"muted": false,
	"stats": { "runs": 0, "bestCombo": 0 }
}
```

Add a case to `Storage.migrate()` when the shape changes; old saves keep working.

## Adding content

A new skin is one entry in `src/data/skins.js` (`palette` + `material`, one of
`standard` / `metal` / `glass` / `neon`). A new backdrop is one entry in
`src/data/backgrounds.js` (gradient `stops`, fog and light colours, `ui` for
light or dark HUD ink). Both show up in the shop automatically.

# Cinematic hero v2 — asset status

The homepage still has no arrival video. The first screen is the dark studio with the real H1, two actions, and text links for the phone, the route, and the VIN quote. These notes record the three models the owner placed in the workspace on 12 Nov 2026, and the G90 shot that is being rendered from them. Nothing here is merged, and nothing is on the production site.

## Files on disk

The Google Drive folder was downloaded into this workspace. The GLBs are gitignored. They are not in the pull request.

| Local path | Bytes | Sketchfab title | Author | Uploader license |
| --- | --- | --- | --- | --- |
| `assets/hero/source/g90/bmw-g90-m5-justgame.glb` | 30,477,340 | BMW G90 M5 | JUST GAME | CC BY 4.0 |
| `assets/hero/source/m4-widebody/bmw-m4-widebody.glb` | 27,544,152 | BMW M4 Widebody Modified | VTDAT23 | CC BY 4.0 |
| `assets/hero/source/m4-gt3/bmw-m4-gt3-evo.glb` | 9,302,992 | 2025 BMW M4 GT3 EVO (G82) | VTX | CC BY-NC-SA 4.0 |

Sources, from the glTF `asset.extras` of each file:

- G90: https://sketchfab.com/3d-models/bmw-g90-m5-9dc9e5c88bec4faa94552fdd0b76ed21
- M4 Widebody: https://sketchfab.com/3d-models/bmw-m4-widebody-modified-4738e45152e144abac79da2a2b9a4c49
- M4 GT3 EVO: https://sketchfab.com/3d-models/2025-bmw-m4-gt3-evo-g82-bb7bb241118344e393164cd00fa7681a

CC BY allows use of the file with attribution. It is not a license from BMW AG and it does not clear the trademarks or the vehicle design. CC BY-NC-SA does not allow the commercial site at all.

## What Blender showed

Blender 4.0.2 opened all three files. Packed images loaded. No texture was missing.

**G90.** 258 meshes, 45 materials, 28 images. World size about 2.19 × 5.10 × 1.48 m, which matches a real G90. The nose points toward -Y. The axles run along X. Wheel hubs are the empties `WHEEL_RF`, `WHEEL_LF`, `WHEEL_LR`, `WHEEL_RR` (radius about 0.37 m). Rims, tires, and brake discs are parented to those empties. Brake calipers stay on the suspension, so they do not spin with the wheel. The visible body is material `0.005`, a dark green. The render script recolours that shell and the black shell `0.002` toward Black Sapphire. The source GLB is not rewritten. Those empties import as quaternions: setting `rotation_euler` without switching `rotation_mode` to `XYZ` does not turn the wheels.

**M4 Widebody.** 101 meshes, 65 materials, 45 images. World size about 2.04 × 4.87 × 1.35 m once the imported 2 m cube, light, and camera are removed. Four tire empties, nose toward -Y, radius about 0.33 m. The paint is a dark carbon widebody with a wing. It is the second car in the animatic.

**M4 GT3 EVO.** 288 meshes, 20 materials, 45 images, and separate wheel objects. The imported size is about 0.021 × 0.050 × 0.014 m, roughly one hundred times too small. Scaled by 100 it measures 2.06 × 5.02 × 1.39 m, the images load, and the body is a recognisable GT3 with a wing and separate wheels. The license is CC BY-NC-SA. This model must not be encoded into the homepage, a preview that customers can open, or any other commercial page. Scaling it does not change that.

## Alternative GT3, not in the shot

Checked on 12 Nov 2026 via the public Sketchfab API, model `0feb1f9793c14b35971518a93a97d688`:

https://sketchfab.com/3d-models/bmw-m4-gt3-evo-0feb1f9793c14b35971518a93a97d688

| Field | Value |
| --- | --- |
| Title | BMW M4 GT3 EVO |
| Author | MattDoesBlender |
| License | CC BY 4.0 (`by`). Sketchfab's own line: "Author must be credited. Commercial use is allowed." |
| Published | 17 Jun 2025 |
| Description | Empty. No extra restriction is written on the model. |
| Price | None. Marked downloadable, not protected. |

This is a different file from MattDoesBlender's G90, which was CC BY-NC-SA. CC BY still is not a license from BMW AG. The file is not in this workspace and was not downloaded. The third mark stays empty until the owner supplies that GLB and it passes the same Blender check as the other two.

## Lineup animatic

`scripts/cinematic-hero/render_lineup.py` is one Eevee scene and one camera. It is not a finished trilogy and it is not on the page.

- 0.35–4.05 s: G90 enters from the right on a cubic Bezier, heading about -68° to -46°. The body yaw is the path tangent. Front wheels steer with the curvature, then straighten. Roll and brake pitch come from steer and deceleration. Wheel spin is arc length divided by the measured radius. Spots at the lamps ease on as it stops. Parked near (0.15, 0.35).
- 4.45–7.45 s: M4 Widebody enters from the left on its own Bezier and stops near (-5.15, 3.45), heading about 58°, left and behind the G90. Centerline clearance while it moves is about 3.5 m.
- The right-rear mark (4.55, 5.35), heading -70°, is empty. A reserved entry from (16.0, 8.2) is in the script and is not rendered. The VTX file is not imported.

The straight-line script `render_g90_arrival.py` now only points at this one. Renders stay in gitignored `assets/hero/renders/lineup/`. Quality stills are 1400×788. The animatic is 8 fps, 960×540, 8 seconds, no sound.

## Still not done

- The homepage hero is unchanged: no `<video>`, no poster, no reduced-motion fallback.
- No Lighthouse pass of a video hero.
- The third car is not in the scene.
- No production deploy and no merge.

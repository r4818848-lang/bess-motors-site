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

## M4 GT3 EVO, MattDoesBlender

The owner added `bmw-m4-gt3-evo.zip` (32.8 MB) to the same Drive folder. The archive is a Sketchfab source package dated 17 Jun 2025 21:29, which is the publish time of model `0feb1f9793c14b35971518a93a97d688`. Inside it, `BMW M4.glb` has 46 materials and 14 packed images. That matches the public Sketchfab record for MattDoesBlender's "BMW M4 GT3 EVO": CC BY 4.0, commercial use of the file allowed if the author is credited. The GLB JSON itself has no author or license field. It is not the VTX file: that file is still 9,302,992 bytes, SHA-256 `b7d79ca0…`, and it is not imported.

Blender 4.0.2 reads the GLB. Length about 5.08 m, width about 2.09 m, tire radius about 0.35 m. The export is Y-up, so the script turns it onto the wheels. An upside-down second copy (`mesh_132`) is hidden. Wheel meshes are not named; the script clusters the four hubs and spins only the parts that stay on the axle.

Saved, gitignored, at `assets/hero/source/gt3-ccby/bmw-m4-gt3-evo-mattdoesblender.glb`.

### What the file license does not cover

CC BY 4.0 is the uploader's license for this 3D file. It is not a license from BMW AG. It does not grant the BMW trademark, the roundel, the grille, or the vehicle design, and it does not allow the page to imply that BMW sponsors or supplied the film. The race livery also carries other brands. Those marks are not cleared by the model license. Attribution, if this film is later shown, has to name MattDoesBlender, JUST GAME, and VTDAT23, and link CC BY 4.0. The VTX model stays unused.

## Lineup animatic

`scripts/cinematic-hero/render_lineup.py` is one Eevee scene. It is the review film, not the page.

- 0.35–4.05 s: G90 enters from the right on a cubic Bezier, heading about -68° to -46°, and stops near (0.15, 0.35). Body yaw is the path tangent. Front wheels steer, then straighten. Wheel spin is arc length divided by the tire radius.
- 4.45–7.45 s: M4 Widebody enters from the left and stops near (-5.15, 3.45), behind-left. Centerline clearance about 3.5 m.
- 7.85–11.15 s: GT3 enters from the right and stops near (6.4, 5.7), heading about -66°, behind-right. Centerline clearance about 3.5 m.
- Hold to 12 s. Desktop camera 24 mm. Mobile camera is the same scene with a horizontal sensor fit so the portrait frame keeps all three cars.

The review animatic is 24 fps. Desktop frames are 1280×720. Mobile frames are 720×1280. Stills are 1600×900 and 900×1600. Nothing here is merged or published.

## Final CGI, after this animatic is accepted

- Keep this blocking, these paths, and both cameras. Re-render in Cycles rather than raising Eevee samples on the review film.
- Desktop 1920×1080 and mobile 1080×1920, 24 fps, 12 s, AgX, denoised. A test frame should set the sample count; 128 samples with a denoiser is the starting point.
- Replace the spotlight beams with the cars' own lamp geometry, and let the sun cast the contact shadows.
- Read the GT3 livery at full size before any public frame. Third-party marks on the body are a separate clearance from CC BY.
- Do not encode the VTX GLB. Do not commit any GLB. Put the attribution next to the player, not only in this note.

## Still not done

- The homepage hero is unchanged: no `<video>`, no poster, no reduced-motion fallback.
- No Lighthouse pass of a video hero.
- The third car is not in the scene.
- No production deploy and no merge.

# Cinematic hero v2 — asset status

The homepage still has no arrival video. The first screen is the dark studio with the real H1, two actions, and text links for the phone, the route, and the VIN quote. These notes record the three models the owner placed in the workspace on 12 Nov 2026, and the 12-second three-car review animatic rendered from them. Nothing here is merged, and nothing is on the production site.

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

The second pass tightens the group and lifts the studio. G90 stops near (0.05, 0.0), heading -38°. M4 Widebody stops near (-2.95, 2.25), heading -18°, about 0.85 m of body clearance. GT3 stops near (5.5, 2.9), heading -50°, about 0.8 m of body clearance. The previous parks were roughly twice as far apart. Body yaw is the path tangent. Front wheels steer, then straighten. Wheel spin is arc length divided by the tire radius.

- 0.15–3.35 s: G90 sweeps in from the right, from a near-profile heading of -82° into the hero three-quarter.
- 3.55–6.05 s: M4 Widebody turns in from the left and settles behind-left.
- 6.25–8.45 s: GT3 comes in from the right on its own arc and settles behind-right, nose at -50° so the side reads.
- Hold to 9 s. Desktop lens 32 mm. Mobile lens 24 mm, camera lower, horizontal sensor fit so the flanks stay in frame.

Wheel check in Blender: G90 has 11, 11, 11 and 9 visible meshes on the four hubs. M4 has a tire, rim, and brake on each hub (4 meshes). GT3 tires sit on the axle (spin shift 0). Meshes whose centres leave the hub by more than 5 cm stay hidden so a duplicate rim cannot orbit off the car. The dark first cut hid the M4's black tires and dark rims; the new kicker-free studio light and brighter rim roughness make them readable.

Materials: G90 paint is a slightly lighter Black Sapphire with clearcoat. M4 glass, which the export stored as opaque, is transmission 0.92. M4 rims are metallic roughness 0.2. GT3 body panels, which were a flat roughness-0.5 albedo, get a clearcoat so the livery reads as paint. This Blender build does not register Cycles until the addon is enabled, and the addon rejects the script's own flags unless they are removed from argv first.

The review animatic is 24 fps, 9 seconds, no audio, 1280×720. The frame sequences stay gitignored. Review files the owner can open are committed under `docs/review/`. Nothing here is merged or published.

### GT3 livery, before any public frame

The body atlas carries third-party marks that CC BY does not clear. Visible on the texture: Michelin, Goodyear, Monster Energy, WEC, 24h, Snap-on, D.I.D, Fastron, BMW Oman, plus BMW roundels, M stripes, M Motorsport and the number 46. Those need to be painted out or replaced before a production frame. The BMW marks themselves are not licensed by the model file.

## Final CGI, after this animatic is accepted

- Keep this blocking, these paths, and both cameras. Re-render in Cycles rather than raising Eevee samples on the review film.
- Desktop 1920×1080 and mobile 1080×1920, 24 fps, 12 s, AgX, denoised. A test frame should set the sample count; 128 samples with a denoiser is the starting point.
- Replace the spotlight beams with the cars' own lamp geometry, and let the sun cast the contact shadows.
- Read the GT3 livery at full size before any public frame. Third-party marks on the body are a separate clearance from CC BY.
- Do not encode the VTX GLB. Do not commit any GLB. Put the attribution next to the player, not only in this note.

## Cycles test, 13 Nov 2026

Ubuntu's Blender 4.0.2 package loads Cycles, but its denoiser list is empty and OpenImageDenoise is not linked. The official Blender 4.0.2 linux-x64 build from blender.org accepts `scene.cycles.denoiser = "OPENIMAGEDENOISE"` even though `enum_items` is empty. A 64×64 test cube rendered with denoising on. The quality frames below use that binary, CPU, adaptive sampling at 0.03, AgX, exposure 0.35.

These are review frames. They are not on the homepage. The 12-second film was not rendered.

- Desktop 1920×1080, 32 samples, OpenImageDenoise: `docs/review/v3-cycles-desktop.png`
- Mobile 1080×1920, 32 samples, OpenImageDenoise: `docs/review/v3-cycles-mobile.png`
- Motion beats, 1280×720, 16 samples, about 3 seconds, not the 12-second film: `docs/review/v3-motion-test.mp4`
- Front axle at 2.7 s, when the G90 steer is 12.6°: `docs/review/v3-axle-steer.png`

Parked lineup is unchanged: G90 near (0.05, 0), M4 Widebody near (-2.95, 2.25), GT3 near (5.5, 2.9). During the move the closest body-segment gap is 2.08 m for the M4 and 2.14 m for the GT3, so the paths do not cross. Logged front steer, then 0 when parked: G90 6.0° at 1.55 s and 12.6° at 2.70 s; M4 5.4° at 4.70 s; GT3 10.8° at 7.25 s. Hub mesh counts: G90 11, 11, 11, 9; M4 4, 4, 4, 4; GT3 5, 6, 5, 6.

The floor is a dark reflective plane so the cars and their contact reflections read against the black studio. The mobile frame keeps the three cars in the lower half, with studio black above. The M4 nose sits close to the left edge. That frame is for review, not a finished phone hero.

The blue-red streak on the G90 rear door is a reflection of the GT3 livery and the rim light. It is not a missing texture. It should be judged with the stills, not painted over in the model.

### Attribution, required before any public frame

| Car | Author | File license | Sketchfab |
| --- | --- | --- | --- |
| BMW G90 M5 | JUST GAME | CC BY 4.0 | https://sketchfab.com/3d-models/bmw-g90-m5-9dc9e5c88bec4faa94552fdd0b76ed21 |
| BMW M4 Widebody Modified | VTDAT23 | CC BY 4.0 | https://sketchfab.com/3d-models/bmw-m4-widebody-modified-4738e45152e144abac79da2a2b9a4c49 |
| BMW M4 GT3 EVO | MattDoesBlender | CC BY 4.0 | https://sketchfab.com/models/0feb1f9793c14b35971518a93a97d688 |

CC BY 4.0 is the uploader's license for the file. It is not a license from BMW AG. It does not clear the BMW trademark, the roundel, the M stripes, the grille, or the vehicle design, and it does not allow the site to imply that BMW sponsors or supplied the picture.

The GT3 body atlas still shows Michelin, Goodyear, Monster Energy, WEC, 24h, Snap-on, D.I.D, Fastron, BMW Oman, BMW roundels, M stripes, M Motorsport, and the number 46. The G90 tire sidewall also reads Michelin, and the wheel centre carries the BMW roundel. Those marks are visible in the test frames. They are not cleared for a public hero. The livery was not painted out. The VTX file (CC BY-NC-SA) is not imported.

## Still not done

- The homepage hero is unchanged: no `<video>`, no poster, no reduced-motion fallback.
- No Lighthouse pass of a video hero.
- The full 12-second Cycles film waits until these test frames are accepted.
- The GT3 livery and the BMW marks are not cleared for publication.
- No production deploy and no merge.

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

## Cycles v4, 13 Nov 2026

Same official Blender 4.0.2, Cycles on CPU, OpenImageDenoise, AgX Base Contrast. Exposure is -0.15. Adaptive sampling threshold is 0.01, with at least 24 samples. Transmission bounces are 8. The softboxes are light-linked to the car meshes. A dim overhead light is the one that reaches the floor, so the contact shadow stays and the floor does not turn into a white sheet. Paint is a dielectric clearcoat (metallic 0), not a metal shader.

These frames replace the v3 test as the current review set. They are not on the homepage. The 12-second film was not rendered.

| Frame | Samples | Time |
| --- | --- | --- |
| Desktop 1920×1080 `docs/review/v4-cycles-desktop.png` | 128 | 64.5 s |
| Mobile 1080×1920 `docs/review/v4-cycles-mobile.png` | 128 | 55.7 s |
| Body, glass, and wheel `docs/review/v4-detail.png` | 96 | 123.4 s |
| Neutral GT3 `docs/review/v4-gt3-neutral.png` | 64 | 33.4 s |
| Motion test, six beats, 1280×720, 5.2 s `docs/review/v4-motion-test.mp4` | 32 | 91.4 s |

The desktop camera leaves the left of the frame dark for the headline. G90 is forward of center, the Widebody is left and behind, the GT3 is right and behind. Logged steer, then 0 when parked, is unchanged: G90 6.0° at 1.55 s and 12.6° at 2.70 s; M4 5.4° at 4.70 s; GT3 10.8° at 7.25 s.

The GT3 racing livery is a copied material in the scene. The source GLB is not rewritten. Sponsor albedo is disconnected on the body, the cabin glass is a glass shader, and four inside-out shells were flipped. Hiding those logos does not license the vehicle design or the BMW trademarks. The G90 tire still reads Michelin and the wheel centre still carries the roundel.

`docs/review/v4-hero-desktop.png` and `docs/review/v4-hero-mobile.png` are the real homepage hero, with the live headline and buttons, and the still placed behind them. The live black wash in `Hero.tsx` was hidden for these two screenshots so the cars can be judged. That component was not edited, and the stills are not wired into the site.

What is still wrong: the GT3 windshield and roof carry a hot highlight; the mobile hero is only as tall as its text, so the lineup sits behind the full-width buttons and the outer cars clip; the desktop headline overlaps the Widebody roof; the frames are darker and simpler than a finished studio photograph.

## Cycles v5, 13 Nov 2026

The owner rejected the v4 composite. This pass changes the paint, the studio, the stance, and the hero. It is a review set. The 12-second film was not rendered, and the stills are posters, not a video.

### Stance

The left car looked raised because the parked M4 sat farther from a 28 mm camera on a black floor, so its tires had no readable contact. The GT3 was a separate, real error: after the Y-up correction its front axle was about 12 cm above the rear. `plant_car` now measures vertices within 24 cm of each hub, pitches the rig until the front and rear contact differ by less than 8 mm, then drops the car until the lowest tire is 4 mm above the floor. A splitter that would sink lifts the whole car.

Measured at the parked frame: G90 front 4.0 mm, rear 5.9 mm, pitch bias 0. M4 front 4.0 mm, rear 6.2 mm, pitch bias 0. GT3 front 7.2 mm, rear 4.0 mm, pitch bias 0.059 rad (about 3.4° nose down). The diagnostic with the floor grid and contact marks is `docs/review/v5-ground.png`.

### Paint

sRGB hex is converted to linear before the Principled base color.

| Car | Hex | Metallic | Roughness | Coat | Coat roughness |
| --- | --- | --- | --- | --- | --- |
| G90, material `0.005` | `#B5121B` | 0 | 0.32 | 1.0 | 0.028 |
| M4 paint and `ext_red` | `#2E6A4C` | 0 | 0.55 / 0.52 | 0.18 / 0.16 | 0.28 / 0.30 |
| GT3 body copy | `#555B64` | 0.22 | 0.24 | 1.0 | 0.08 |

`#234C3B` went nearly black under this light, so the green is `#2E6A4C`. The green stays a satin dielectric. The red stays a clearcoat dielectric. The graphite is the only paint with a metallic weight, and only on the scene copy. The source GLB is not rewritten. GT3 glass roughness is 0.08 so the windshield does not clip. Exposure is +0.20, AgX.

### Lights

Key 150 W, 12.0 × 3.8 m, at (-2.4, -8.6, 6.6). Fill 190 W, 6.5 × 3.4 m. Wheel strip 36 W. Left rim 130 W, slightly green. Right rim 110 W. A 80 W nose light from the right front. Overhead 90 W, the only light that casts on the floor. Car lights are light-linked to the meshes. World strength 0.28. Floor albedo about 0.055, roughness 0.42.

### Cameras and the page

Desktop is 50 mm, shift X -0.20, at (-2.6, -20.4, 1.04), looking at (1.15, 1.3, 0.58). Mobile is its own 42 mm camera at (0.15, -11.8, 0.82), shift Y -0.08. Parked positions are tighter: M4 (-2.45, 1.55), heading -22°. GT3 (3.35, 1.75), heading -44°. G90 stays at (0.05, 0), heading -38°. Closest body gap during the move is 1.28 m for the M4 and 1.10 m for the GT3.

`Hero.tsx` uses these stills as posters. Desktop text sits in a left column, and the black wash stops at about 34% of the width. Mobile stacks the headline, a 2.4:1 crop of the portrait still, then the two buttons above the contact bar. The phone, route, and VIN links stay on desktop; on a phone those actions are the contact bar. Booking, services, and the phone link were clicked through. The film is not wired in.

| Frame | Samples | Time |
| --- | --- | --- |
| Desktop 1920×1080 `docs/review/v5-cycles-desktop.png` | 128 | 77.6 s |
| Mobile 1080×1920 `docs/review/v5-cycles-mobile.png` | 128 | 74.5 s |
| G90 paint and glass `docs/review/v5-g90.png` | 64 | 55.9 s |
| M4 satin `docs/review/v5-m4.png` | 64 | 50.8 s |
| GT3 nose `docs/review/v5-gt3.png` | 64 | 36.5 s |
| Contact grid `docs/review/v5-ground.png` | 48 | 39.2 s |
| Eight beats, 1280×720, 4 s `docs/review/v5-motion-test.mp4` | 16 | 58.0 s |
| Homepage, Polish, 1440×900 `docs/review/v5-hero-desktop.png` |  |  |
| Homepage, Polish, 390×844 `docs/review/v5-hero-mobile.png` |  |  |

### What is still wrong

The GT3 roof still carries a bright softbox reflection. It is smaller than the v4 white band, and the body pixels read as graphite, but it is not a finished commercial highlight. The G90 close-up is the front door and glass; the wheel is only at the edge of that frame. The G90 tire still reads Michelin and the wheel centre still carries the roundel. Hiding the GT3 sponsor albedo does not license the vehicle design or the BMW marks. The full 12-second film was not rendered.

## Still not done

- No `<video>` on the homepage. The v5 posters are on this branch only, for review.
- No Lighthouse pass of a video hero.
- The full 12-second Cycles film waits until these frames are accepted.
- The GT3 material hides the sponsor art in the scene only. That does not clear the car design or the BMW marks. The G90 Michelin sidewall and the roundel remain.
- No production deploy and no merge.

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

### What v5 left open

The GT3 roof still carried a bright softbox reflection. The G90 close-up was the front door and glass, with the wheel at the edge. The phone hero put the portrait still into a 2.4:1 box. The motion file was eight frames. Those four points are the v5.1 pass below. The tire marks and the BMW roundel were not cleared.

## Cycles v5.1, 13 Nov 2026

Corrections on top of `7904f6a`. This is still a draft. The owner has not accepted it. The 12-second Cycles film was not rendered. Exposure was not lowered to hide the highlight.

### GT3 highlight and stance

The key no longer sits above the roofs. It is a 180 W bank, 14.0 × 1.8 m, at (-0.6, -11.2, 2.55), aimed at (0.4, 0.6, 0.55), light-linked to the cars. Fill is 150 W at (3.6, -9.2, 1.45). The overhead light is 28 W at z 9.5 and is the only light that hits the floor. GT3 clearcoat roughness is 0.16, and the scene-copy glass roughness is 0.12. Exposure stays +0.20.

On the 1920×1080 still, the right-hand zone (x greater than 72% of the frame) has 685 pixels where red, green, and blue are all above 210. The roof reads as a long reflection, not a white panel. The highlight is smaller. It is not gone.

The 3.4° pitch is the correction that levels the Y-up export. After that turn the front axle sat about 12 cm above the rear. `plant_car` pitches until the contacts match, then drops the car. Parked GT3: front 7.2 mm, rear 4.0 mm, rocker 62 mm, bias 0.0589 rad. G90 and M4 stay at bias 0, contacts 4.0 / 5.9 mm and 4.0 / 6.2 mm. The side frame shows a horizontal rocker and four tires on the floor. A real GT3 often carries a slight rake under 1°. This stance is level. It is not an extra nose-down pose added on top of a level car.

![GT3 side, contact grid](docs/review/v51-gt3-side.png)

### Phone hero

The portrait 1080×1920 still is no longer fitted into `aspect-[2.4/1]` with `object-cover`. The phone block uses its own 16:9 frame. Camera 44 mm, shift X -0.14, at (-0.85, -12.6, 0.84), looking at (1.15, 1.45, 0.52). The portrait file stays at `docs/review/v5-cycles-mobile.png` for a later layout. It is not the phone hero.

On a phone the order is the headline, the wide studio, then the two buttons, above the contact bar. Desktop keeps the same wide studio as a full-bleed poster behind a left text column. The picture element requests `/hero/v51-desktop.webp` only at 1024 px and wider. Narrower viewports request `/hero/v51-wide.webp` only.

Second-button bottom, measured in the browser: 716 px on 360×800, 733 px on 390×844, 777 px on 430×932. The contact bar is about 52 px plus its safe-area padding. Both buttons sit above it on those three screens. Booking opens `/booking`. Services opens `/services`. Polish, Russian, English, and Ukrainian headlines were checked. Polish is the longest and stays clear of the green car at 1366, 1440, and 1920.

### Motion preview

`docs/review/v51-motion-preview.mp4` is 288 frames, 0–12 s, 24 fps, 640×360, Eevee, 4 samples, bloom off, screen-space reflections off. It is 282 KB. It is not the Cycles film.

All 288 frames are present. The largest frame-to-frame change is 0.80 grey levels at frame 126, and no frame jumps above 2.8 times its neighbours. From 9 s to 12 s the picture is pixel-identical: the cars are parked and the wheels do not creep. Travelled distance grows through each entrance and then holds: G90 9.7 m, M4 9.0 m, GT3 8.9 m. Steering is 0° once a car is parked. The closest body gap on these paths is 1.28 m for the M4 and 1.10 m for the GT3. Wheel crops aligned between t = 1.67 s and t = 2.00 s show the rim pattern changing while the car advances. At 640 px this cannot measure millimetre slip.

### G90 close-up

64 samples, 42 mm, camera at (-0.05, -3.35, 0.58), looking at (-0.95, -0.95, 0.42). The frame holds the red clearcoat, the near headlamp, the front wheel, the rim, and the base of the windshield. The glass is only the top edge of the frame. The green M4 is still the v5 satin frame: roughness 0.55, coat 0.18, against the red coat weight of 1.0 and coat roughness of 0.028.

### Weight and layout shift

The two public PNGs were about 2.0 MB each and are removed. The posters are WebP, Pillow quality 84: `public/hero/v51-desktop.webp` is 25,468 bytes, `public/hero/v51-wide.webp` is 29,636 bytes. The hero uses a `picture` element, so Next's image optimizer does not emit AVIF for it. This machine's Pillow has no AVIF encoder. A second format was not added.

Cumulative layout shift was 0 at 1366×768, 1440×900, 1920×1080, 360×800, 390×844, and 430×932. On the local Next dev server the largest contentful paint was the hero image: 332 ms at 1366, 624 ms at 1440, 444 ms at 1920, 412 ms at 360, 468 ms at 390, 372 ms at 430. Those times are the dev server, not a production Lighthouse run.

### Rights, still open

The GT3 body livery is hidden on a scene material copy, 27 slots. The source GLB is unchanged. The GT3 sidewalls still read Goodyear and Eagle. The G90 sidewall still reads Michelin, and the wheel centre still has the BMW roundel. CC BY 4.0 is the file author's license. It is not a license from BMW AG. It does not clear the vehicle design, the roundel, the grille, or those tire marks. These frames must not go on the commercial site until that is decided, and the page must not imply that BESS is a BMW partner.

### Frames

| Frame | Samples | Time |
| --- | --- | --- |
| Desktop 1920×1080 `docs/review/v51-cycles-desktop.png` | 64 | 46.3 s |
| Wide 16:9 `docs/review/v51-wide.png` | 64 | 44.6 s |
| G90 close-up `docs/review/v51-g90.png` | 64 | 62.6 s |
| GT3 side `docs/review/v51-gt3-side.png` | 32 | 28.9 s |
| Eevee preview, 288 frames `docs/review/v51-motion-preview.mp4` | 4 | about 2 s each |
| Hero 1440, 1366, 1920, 390, 360, 430 under `docs/review/v51-hero-*.png` |  |  |

### Still a draft

- The GT3 roof reflection is smaller and is still visible.
- The G90 close-up includes only the base of the glass.
- Tire marks and the BMW roundel are still in the frames.
- The 12-second Cycles film was not rendered, and no video is wired into the page.

## Cycles v6, 13 Nov 2026

Draft for visual review. The owner has not accepted it. The 12-second Cycles film was not rendered. No video is wired into the page.

### What changed from v5.1

The three cars are one group. Mesh gap at the park is 0.231 m between the green M4 and the red G90, and 0.323 m between the red G90 and the black GT3. The outer cars are 2.80 m apart. While the M4 is still moving, the closest mesh gap to the parked G90 is 0.206 m (at 90% of its entrance). The GT3's closest is 0.199 m (at 75%). Neither body crosses the other.

The right car is black clearcoat, not graphite. Its nose is no longer the high end: `plant_car` solves roll, then pitch, then drops the car so the lowest tire is 4 mm off the floor. Parked GT3 contacts are 4.0 mm and 8.6 mm at the front, 11.0 mm and 12.7 mm at the rear. Pitch bias is 0.0448 rad. The front rocker is not higher than the rear, so the shell is not given an extra nose-down turn. G90 contacts stay 4.0 / 6.0 mm, M4 4.0 / 6.0 mm.

### Colours and materials

All three paints are dielectric under clearcoat. Metallic is 0.

| Car | Hex | Roughness | Coat | Coat roughness |
| --- | --- | --- | --- | --- |
| Left M4, satin green | #2E6A4C | 0.58 / 0.56 | 0.22 / 0.20 | 0.32 / 0.34 |
| Center G90, burgundy red | #9A1824 | 0.26 | 1.0 | 0.02 |
| Right GT3, black | #14161A | 0.34 | 1.0 | 0.04 |

The green normal map is disconnected on those two paint slots so the hood reads as satin paint. GT3 glass roughness is 0.03. The source GLB is not rewritten.

### Light

Exposure +0.34. World strength 0.62. Floor albedo (0.078, 0.080, 0.086), roughness 0.55, specular 0.36.

| Light | Power | Size | Place |
| --- | --- | --- | --- |
| Key | 240 W | 7.2 × 2.6 m | (-2.8, -8.4, 2.7), in front of the noses |
| Fill | 130 W | 5.6 × 2.4 m | (3.8, -7.4, 1.9) |
| Rim left | 160 W | 2.4 × 1.3 m | (-5.2, 2.4, 1.55), slight green |
| Rim right | 210 W | 1.8 × 1.5 m | (5.6, 2.8, 1.7), separates the black car |
| Edge | 170 W | 1.2 × 3.2 m | (1.6, 6.2, 2.15), rear rim |
| Wheel | 36 W | 4.2 × 0.45 m | (0.1, -4.2, 0.28) |
| Top | 48 W | 12 m | (0.15, 0.6, 7.2), the contact-shadow light |

Headlamp spots are 150 W when a car is parked, aimed forward. Tail spots are 55 W, red. G90 and M4 lenses use the named glass materials with emission 16 (head) and 9 (tail). The GT3 export has no separate lens mesh: the visible nose is one painted shell. Two thin emissive slits, 0.22 × 0.038 m, emission 30, sit on the forward face of that shell, one each side. Two red slits, emission 16, sit on the tail. They are scene cards, not a change to the GLB.

Underglow is four low area lights plus a soft pool, parented to each car, shadows off. Green #1C8F45 at 14 W under the M4. Red #C4162A at 14 W under the G90. Dark burgundy #8A2444 at 26 W under the GT3. It is a floor pool, not a neon tube. On the black car it reads as a thin line, quieter than the red pool.

### Cameras

Beauty, no text: 58 mm at (-0.15, -9.6, 0.86), looking at (0.05, 0.15, 0.46). Wide phone frame: 42 mm, shift X -0.06, at (-0.35, -8.8, 0.74). Desktop poster: 40 mm, shift X -0.20, at (-0.15, -15.8, 1.05), looking at (1.05, 0.45, 0.50), so the left third stays dark for the Polish headline and the black car stays inside the frame. Detail cameras follow each car's parked heading and look at the nose, not the roof.

The ground frame turns on an orange contact marker at each tire and a checker on the floor. Those marks are only on that proof frame. The beauty, wide, and desktop frames do not have them.

### Motion preview

`docs/review/v6-motion-preview.mp4` is the Eevee check of the new paths: 10 seconds, 24 fps, 640×360, 4 samples, bloom off, screen-space reflections off. It is not the Cycles film. The G90 arcs in from the right and parks in the center. The M4 arcs in from the left; its last handle is 4.8 m so it slides into the slot instead of rotating the nose through the red car. The GT3 arcs in from the right and parks on the right. Lamps come up at the end of each entrance.

### Hero page

The picture element requests `/hero/v6-desktop.webp` only at 1024 px and wider, and `/hero/v6-wide.webp` below that. Pillow WebP quality 86. Desktop loads the desktop file. Phones load the wide file. Cumulative layout shift was 0 on the measured viewports. Booking opens `/booking`. Services opens `/services`. On 360×800 the second button bottom is 716 px. On 390×844 it is 733 px. On 430×932 it is 755 px. The contact bar is about 52 px. Both buttons sit above it.

### Still open

- The GT3 headlamps are slits on the painted nose, not the projector optics the G90 and the M4 already have. The owner has to decide if that reads as a real lamp.
- The burgundy pool under the black car is the quietest of the three.
- The GT3 sidewalls still read Goodyear and Eagle. The G90 sidewall still reads Michelin, and the wheel centre still has the BMW roundel. CC BY 4.0 is the file author's license. It is not a license from BMW AG. These frames must not go on the commercial site until that is decided.
- The 12-second Cycles film was not rendered.

### Frames

| Frame | Samples | Time |
| --- | --- | --- |
| Desktop 1920×1080 `docs/review/v6-cycles-desktop.png` | 48 | 67.3 s |
| Beauty, no text `docs/review/v6-beauty.png` | 48 | 82.1 s |
| Wide 16:9 `docs/review/v6-wide.png` | 48 | 49.7 s |
| G90 close-up `docs/review/v6-g90.png` | 48 | 53.3 s |
| M4 close-up `docs/review/v6-m4.png` | 48 | 38.0 s |
| GT3 close-up `docs/review/v6-gt3.png` | 48 | 30.3 s |
| Ground contact `docs/review/v6-ground.png` | 32 | 32.6 s |
| Eevee preview `docs/review/v6-motion-preview.mp4` | 4 | 10 s, 640×360 |
| Hero 1920, 1440, 1366, 430, 390, 360 under `docs/review/v6-hero-*.png` |  |  |

## V7 — visual approval required

V6 is not accepted. V7 is the next draft, still not the film and still not on production. Reference C (the attached studio photograph) is the quality target for brightness, headlamp read, floor glow, and the premium lineup. It is not a colour lock: in that photograph the right car is burgundy, and this scene keeps the right car black.

### What changed from V6

The three cars sit closer, with the G90 as the centre car and the other two a step behind. Mesh clearance at the park is 0.222 m between the M4 and the G90, and 0.275 m between the GT3 and the G90. The tightest point on the arcs is 0.200 m (M4, u=0.90) and 0.137 m (GT3, u=0.75). Those are gaps, not intersections. The source GLBs are not rewritten.

Every tire is on the floor. Lowest tire points from the contact pass: G90 4.0–13.2 mm, M4 3.8–19.4 mm, GT3 5.2–11.4 mm. The GT3 front tires (5.2 mm and 8.3 mm) sit lower than the rear tires (11.2 mm and 11.4 mm), so the nose is not raised. A low camera can still make the wing look high. The beauty camera is at 0.64 m so the rocker reads level.

| Car | Paint | Roughness | Clearcoat | Coat roughness |
| --- | --- | --- | --- | --- |
| Left M4, satin green | #1C8C4A | 0.46 / 0.44 | 0.34 / 0.30 | 0.18 / 0.20 |
| Centre G90, burgundy | #6C1528 | 0.18 | 1.0 | 0.012 |
| Right GT3, black | #0B0C0F | 0.18 | 1.0 | 0.02 |

#6C1528 replaces the V6 scarlet #9A1824. The green is lighter than V6 #2E6A4C so it stays readable, and the coat stays low so it does not go full gloss. The GT3 clearcoat is tighter than V6 so the panels separate from the background. Glass roughness stays 0.03.

Exposure is +0.48. World strength is 0.9. The floor is (0.045, 0.046, 0.050), roughness 0.18, specular 0.58, so the coloured light stretches toward the camera. A fog-glow composite (threshold 0.65, mix −0.48, size 6) blooms the lamps without replacing the render.

Head spots are 70 W and aimed at lamp height, so they do not paint white bars on the floor. G90 and M4 lens materials emit at 80 (head) and 36 (tail). The GT3 file has no separate lamp mesh. The scene adds a pod on the ray-hit nose and tail: a dark housing, a metal bowl, two emissive projectors, a thin DRL, a bezel, and a glass cover, parented to the rig. At the beauty distance the fascia opening still reads as a bright slit. The G90 close-up is the frame that shows a real LED lamp. That limit is the model, not the exposure.

Underglow is parented to each car and hidden from the camera, so the floor shows the light and not a floating rectangle. Green #18F06A at 90 W under the M4. Burgundy #D01238 at 105 W under the G90 and 120 W under the GT3. Each car has side skirts, a nose patch, a forward wash, a tail, and a shadowed pool under the body. It is stronger than the V6 pools (14 W and 26 W) and it reflects on the floor. It is still a tighter band than the photograph.

### Cameras and the page

Beauty, no text: 40 mm at (0.08, −9.8, 0.64). Wide phone frame: 36 mm at (−0.05, −7.6, 0.55). Desktop poster: 40 mm, shift X −0.30, at (0.15, −14.2, 0.78), so the left third of the file stays dark. On viewports from 1024 px the picture is scaled to 0.86 from the right edge, which keeps the Polish headline and the address off the green nose on a 1366 px screen. A pixel test on `v7-hero-1366.png` found no white headline pixel touching the green body.

The picture requests `/hero/v7-desktop.webp` (48 332 bytes) from 1024 px and `/hero/v7-wide.webp` (66 190 bytes) below that. Pillow quality 86. One viewport loads one file. Polish cumulative layout shift on the measured viewports was under 0.001. Booking opens `/booking`. Services opens `/services`. On 360×800 the second button ends at 716 px. On 390×844 it ends at 733 px. On 430×932 it ends at 755 px. The contact bar is about 52 px. Both buttons sit above it.

### Motion preview

`docs/review/v7-motion-preview.mp4` is an Eevee animatic of the whole entrance: 12 seconds, 24 fps, 640×360, 4 samples, bloom off, screen-space reflections off. It is not the Cycles film. The G90 enters from the right and parks by 3.5 s. The M4 enters from the left and parks by 6.2 s. The GT3 enters from the right and parks by 9 s. From 9 s to 12 s the three cars hold, with the lamps and the underglow on. The homepage still shows the still poster. No `<video>` is wired.

### Still short of the photograph

- The GT3 lamp is a lit pod in a slit opening. It does not yet read as the large projector headlamp in the photograph.
- The floor glow is a readable coloured reflection under each car. It is not as wide or as bright as Reference C.
- The bodies are still these three GLBs. Clearcoat, glass, and the studio banks make them read better than V6. They are not a photograph.
- Goodyear and Eagle remain on the GT3 tires. Michelin and the BMW roundel remain on the G90. CC BY 4.0 is the file author's license. It is not a license from BMW AG. BESS MOTORS is not a BMW partner. These frames must not go on the commercial site until that is decided.

### Frames

| Frame | Samples | Time |
| --- | --- | --- |
| Desktop 1920×1080 `docs/review/v7-cycles-desktop.png` | 40 | 49.2 s |
| Beauty, no text `docs/review/v7-beauty.png` | 40 | 68.1 s |
| Wide 16:9 `docs/review/v7-wide.png` | 40 | 54.6 s |
| G90 close-up `docs/review/v7-g90.png` | 32 | 38.0 s |
| M4 close-up `docs/review/v7-m4.png` | 32 | 31.3 s |
| GT3 close-up `docs/review/v7-gt3.png` | 32 | 27.8 s |
| Headlamp `docs/review/v7-lamps.png` | 32 | 78.9 s |
| Floor glow `docs/review/v7-glow.png` | 32 | 56.3 s |
| Ground contact `docs/review/v7-ground.png` | 28 | 27.9 s |
| Eevee preview `docs/review/v7-motion-preview.mp4` | 4 | 12 s, 640×360 |
| Comparison `docs/review/v7-compare.png` |  | V6, V7, Reference C |
| Hero 1920, 1440, 1366, 430, 390, 360 and ru/en/uk under `docs/review/v7-hero-*.png` |  |  |

## V8 — visual approval required

V7 is not accepted. The new reference is the attached studio photograph: green car on the left, metallic blue car in the centre, burgundy car on the right, with headlights and coloured floor light. That photograph replaces the V7 colour lock. The centre car is no longer burgundy, and the right car is no longer black. The photograph is a lighting and colour target. It is not composited into the page, and its logo is not copied into the scene. The site keeps its own header and the left-hand text.

### This machine

The Cloud Agent that built V8 is CPU only.

| Check | Result |
| --- | --- |
| OS | Linux 6.12.113+ x86_64 |
| CPU | 4 cores, Intel Xeon |
| GPU | none. `nvidia-smi` is absent and `/dev/dri` does not exist |
| VRAM | 0 |
| RAM | 15 GB system memory, not video memory |
| Disk free | 237 GB of 254 GB |
| Python | 3.12.3 |
| PyTorch | not installed |
| CUDA / ROCm | not available |

`scripts/cinematic-hero/comfy/edit_hero.py` was started against `docs/review/v8-beauty.png`. It exited with code 2 and printed that PyTorch is not installed. It did not download weights and it did not write an image. ComfyUI was not installed. No AI frame exists for this pass.

### Models that were not downloaded

Sizes and licenses below were read from the public GitHub repositories and Hugging Face model cards on 13 Nov 2026. They are not install receipts.

| Tool | Code license | Weight license | Download | Decision |
| --- | --- | --- | --- | --- |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | GPL-3.0 | — | code repo about 108 MB | Not installed. No GPU to serve it. |
| [ComfyUI-Manager](https://github.com/Comfy-Org/ComfyUI-Manager) | GPL-3.0 | — | code repo about 204 MB | Not installed. Custom nodes were not added. |
| [Qwen-Image](https://github.com/QwenLM/Qwen-Image) / `Qwen/Qwen-Image-Edit-2511` | Apache-2.0 | Apache-2.0 | 57.72 GB | The image editor to run later, on a GPU. Practical floor used in the recipe: 24 GB VRAM with offload. Not downloaded. |
| [FLUX.1-schnell](https://github.com/black-forest-labs/flux) | Apache-2.0 | Apache-2.0 | `flux1-schnell.safetensors` 23.78 GB. The tree listing sums to 57.85 GB because it also lists the shards. | Commercial text-to-image. Not a replacement for the Blender scene. Not downloaded. |
| FLUX.1-dev | Apache-2.0 code | Hugging Face license field `other` | — | Not for the advertisement. Not downloaded. |
| [Wan2.2 TI2V-5B](https://github.com/Wan-Video/Wan2.2) | Apache-2.0 | Apache-2.0 | 34.20 GB | Video model. Not downloaded. A CPU pass would not be a usable check of identity. |
| [LTX-2](https://github.com/Lightricks/LTX-2) | Apache-2.0 | LTX-2 Community License (`license: other`). Entities with annual revenue of at least $10,000,000 need a paid commercial license. | One distilled file is 43.29 GB. The tree lists many variants and sums to 314 GB. | Not installed. Do not use the weights on the advertisement until the owner checks that revenue clause. The card points at a newer LTX-2.3. |

Wan and LTX were not installed together. Neither was installed. The 12-second preview is Blender Eevee, not an AI video.

### Paint

Sampled body pixels on the Cycles beauty frame: left (42, 96, 57), centre (11, 45, 90), right (86, 23, 28). Shader bases:

| Car | Paint | Metallic | Roughness | Clearcoat | Coat roughness | Underglow |
| --- | --- | --- | --- | --- | --- | --- |
| Left M4 | #187A3C | 0 | 0.32 / 0.30 | 0.72 / 0.68 | 0.06 / 0.07 | #18F06A, 150 W |
| Centre G90 | #0E3F96 | 0.30 | 0.24 | 1.0 | 0.012 | #2F74FF, 175 W |
| Right GT3 | #8E1C2A | 0 | 0.15 | 1.0 | 0.012 | #E01430, 185 W |

Head and tail emission on the G90 and M4 lenses is 120 and 50. Three thin neon areas sit off camera: green, blue, and red. The cars, the parks, and the arcs are the V7 layout. Mesh clearance stays 0.222 m (M4) and 0.275 m (GT3). The source GLBs are not rewritten.

The GT3 kidneys are still pale. A pass over the nose looked for a small separate grille mesh and found none (`GRILLE darkened=0`). The white slats belong to the body shell. Recolouring that shell would paint the burgundy panels, so they were left. The GT3 lamp is still the slit pod from V7. The G90 close-up is the frame with a real LED lamp.

### Page

The picture requests `/hero/v8-desktop.webp` (60 246 bytes) from 1024 px and `/hero/v8-wide.webp` (57 382 bytes) below that. Pillow quality 86. There is no `<video>`. On 1366×768 the headline box ends at x=488 and the green body starts at x=601. No green pixel sits inside the headline box. Polish layout shift on the dev server: 0.00020 at 1366, 0.00016 at 1440, 0.00007 at 1920, and 0 at 360, 390, and 430. "Umów wizytę" opens `/booking`. "Sprawdź usługi" opens `/services`. The second button ends at 716 px on 360×800, 733 px on 390×844, and 755 px on 430×932. The contact bar starts at 739, 783, and 871 px. These times are the local dev server, not a production Lighthouse pass.

### Motion preview

`docs/review/v8-motion-preview.mp4` is an Eevee animatic of the same entrance with the V8 colours: 12.000 seconds, 24 fps, 288 frames, 640×360, 4 samples, bloom off, screen-space reflections off, 510 010 bytes. It is not the Cycles film and it is not an AI video. The largest frame steps are cars entering: 17.5 grey levels at frame 88 (3.67 s) and 4.3 at frame 153 (6.38 s). After the park (frame 220 onward) the largest step is 0.061. The floor in this file is speckled because the pass is 4-sample Eevee. The Cycles stills are the frames to judge. The homepage still shows the still poster.

### What an AI video must clear before it replaces Blender

A later GPU edit of `docs/review/v8-beauty.png` is allowed only if the three bodies, the wheel count, the kidney shapes, and the green / blue / burgundy assignment stay put. If a video model changes a body, a lamp, a wheel, or a path, it does not go into the 12-second film. The film stays a Cycles render of this scene, and only after the owner accepts the still.

### Frames

| Frame | Samples | Time |
| --- | --- | --- |
| Desktop 1920×1080 `docs/review/v8-cycles-desktop.png` | 40 | 51.9 s |
| Beauty, no text `docs/review/v8-beauty.png` | 40 | 69.1 s |
| Wide 16:9 `docs/review/v8-wide.png` | 40 | 55.0 s |
| G90 close-up `docs/review/v8-g90.png` | 32 | 38.0 s |
| M4 close-up `docs/review/v8-m4.png` | 32 | 31.6 s |
| GT3 close-up `docs/review/v8-gt3.png` | 32 | 30.1 s |
| Headlamp `docs/review/v8-lamps.png` | 32 | 63.9 s |
| Floor glow `docs/review/v8-glow.png` | 32 | 59.5 s |
| Ground contact `docs/review/v8-ground.png` | 28 | 29.5 s |
| Eevee preview `docs/review/v8-motion-preview.mp4` | 4 | 12 s, 640×360 |
| Comparison `docs/review/v8-compare.png` |  | V7, V8, the new reference |
| Hero 1920, 1440, 1366, 430, 390, 360 and ru/en/uk under `docs/review/v8-hero-*.png` |  |  |

Goodyear and Eagle remain on the GT3 tires. Michelin and the BMW roundel remain on the G90. CC BY 4.0 credits JUST GAME (G90), VTDAT23 (M4 Widebody), and MattDoesBlender (GT3). That is the file authors' license. It is not a license from BMW AG. BESS MOTORS is not a BMW partner.

## Windows 8 GB pipeline — not run

Cloud GPU rental is cancelled. The next machine is the owner's Windows 11 PC: RTX 5060 Ti 8 GB, Ryzen 7 7800X3D, 32 GB RAM. The entry point is `scripts/cinematic-hero/comfy/windows/README.md`.

ComfyUI 0.45.0 portable NVIDIA (CUDA 13.0 package, 2,071,479,423 bytes) is the install. It binds to 127.0.0.1 and starts with `--offline`. The download script was not executed here.

The graph is SDXL img2img at 896×512, denoise 0.32, with the xinsir union ControlNet on Canny. SDXL base is Open RAIL++-M. The fp16 VAE fix is MIT. The ControlNet is Apache-2.0. Qwen-Image-Edit-2511 is not downloaded. FLUX.1-schnell Q4_K_S is Apache-2.0 and 6.78 GB, and ComfyUI 0.45 has no GGUF loader, so it is not installed. No image has been generated.

`BESS_CYCLES_DEVICE=GPU` asks the existing render script for OptiX, then CUDA. The default remains CPU. The 12-second Cycles film is still waiting.

## V8 AI pipeline — not run

The 80 GB recipe is kept and is not the current step. The V8 still is the input. There is no V9 lighting pass. The Cloud Agent still has no GPU, so those weights were not downloaded and no AI frame exists.

`scripts/cinematic-hero/comfy/edit_hero.py` calls the official `QwenImageEditPlusPipeline` for `Qwen/Qwen-Image-Edit-2511` (Apache-2.0, 57.72 GB). Diffusers is pinned at 0.43.0. On this machine the script exits 2 before `from_pretrained`. A dry run exits 0 and only prints the three variant names.

The transformer files are 40.86 GB. `pipeline.to("cuda")` is the official model-card call and is the mode for an 80 GB card. It is not offloading. `enable_model_cpu_offload()` is implemented for a card that reports at least 48 GB, and `enable_sequential_cpu_offload()` only runs when asked for by name. Neither offload mode has been executed. A 24 GB card is refused. The script does not claim that floor is verified.

The GT3 kidneys stay pale. A material census after the V8 recolour shows the body shells on an unlinked burgundy base `(0.27, 0.01, 0.02)`. There is no separate unlinked white grille material on those shells. The edit prompt forbids redrawing that grille. Splitting the faces is the geometry fix, and it was not done in this pass.

The first paid step is one 80 GB GPU, 64 GB of system RAM, and 120 GB of free disk, for about two hours. Public on-demand ranges on 13 Nov 2026 were roughly $0.87–$1.72 per hour for an A100 80GB and roughly $2.69–$3.87 per hour for an H100 80GB. That is a published range, not a reservation. No account was opened.

## Still not done

- No `<video>` on the homepage. The v8 posters are on this branch for review. The v7 and v6 files stay.
- No AI image was generated. The runnable entry point is `scripts/cinematic-hero/comfy/edit_hero.py`. It has not loaded a model.
- No production Lighthouse pass. The times above are the local dev server.
- The full 12-second Cycles film waits until the owner accepts these frames.
- The GT3 material hides the sponsor art in the scene only. That does not clear the car design, the BMW marks, or the tire marks.
- No production deploy and no merge.

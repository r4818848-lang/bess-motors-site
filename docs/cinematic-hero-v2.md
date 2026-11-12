# Cinematic hero v2 — asset status

The homepage no longer uses the old advertising banner or the boxed SVG car.
A realistic BMW M5 G90 drive-in is **not** in this change. No substitute cartoon was published.

## What was removed

- `siteConfig.bannerImage` (`/images/banner.png`) as the hero background. The file stays: it is still the Open Graph image. The banner also shows chip-tuning and wheel-alignment claims that this hero should not repeat.
- `DriveInCar` inside a rounded card on the homepage. `DriveInCar` remains available for service-landing scenes.

## Why there is no G90 in the scene

A recognizable BMW model needs a license the uploader is allowed to grant, and a file we can actually download. Checked on 12 Nov 2026:

| Model | License from the uploader | Commercial use of the file | Download |
| --- | --- | --- | --- |
| [Res1n — Bmw M5 G90](https://sketchfab.com/3d-models/bmw-m5-g90-7c2f50314164408a86c958077a644143) | CC BY 4.0 | Allowed with attribution to Res1n | Sketchfab API returned 401 without an account |
| [JUSTGAME — BMW G90 M5](https://sketchfab.com/3d-models/bmw-g90-m5-9dc9e5c88bec4faa94552fdd0b76ed21) | CC BY 4.0 | Allowed with attribution | 401 |
| [romanian_guy_0069 — Bmw M5 G90](https://sketchfab.com/3d-models/bmw-m5-g90-a1f2894ca5c5457fa09f13e7ad547285) | CC BY 4.0 | Allowed with attribution | 401 |
| [vecarz — BMW M5 G90 2024](https://sketchfab.com/3d-models/bmw-m5-g90-2024-wwwvecarzcom-b2dd13e63c2649c3be90da30e6670a46) | CC BY-NC-SA | Not allowed | Not used |
| [MattDoesBlender — full G90](https://sketchfab.com/3d-models/bmw-m5-g90-full-final-11-10-2024-51cc5edf1ac74c39ad7c042d03aa4141) | CC BY-NC-SA | Not allowed | Not used |

CC BY from a Sketchfab author is not a license from BMW AG. It does not clear the trademarks or the vehicle design. Paid fan models exist (for example a G90 listing on 3DExport at about 42.50 USD). None were purchased. Official BMW press images were not downloaded.

An original Blender sedan was modeled and rendered in this workspace. The stills read as a smooth blob with floating glass, not as a realistic G90. That render was not committed and is not on the page.

## What unblocks the drive-in

1. The owner downloads a CC BY G90 (attribution required) or approves buying a specific commercial file, and confirms they accept the BMW trademark risk.
2. Place the `.glb` or `.blend` in the repo or send it with the job.
3. The arrival can then be rendered as WebM/MP4 (desktop and mobile) or played in a hero-only WebGL scene, with a still fallback for reduced motion.

Until that file exists, the first screen is a dark studio with the real H1, two actions, and text links for the phone, the route, and the VIN quote.

# Car models for the cinematic hero

Three GLBs from the owner's Google Drive folder live here. They are listed in `.gitignore` and are not part of the pull request.

| Path | Model | Uploader license |
| --- | --- | --- |
| `g90/bmw-g90-m5-justgame.glb` | BMW G90 M5, JUST GAME | CC BY 4.0 |
| `m4-widebody/bmw-m4-widebody.glb` | BMW M4 Widebody Modified, VTDAT23 | CC BY 4.0 |
| `m4-gt3/bmw-m4-gt3-evo.glb` | 2025 BMW M4 GT3 EVO, VTX | CC BY-NC-SA 4.0 |

CC BY is the uploader's file license, not a BMW AG trademark or design license. CC BY-NC-SA cannot be used on the commercial site. Details and the Blender check are in `docs/cinematic-hero-v2.md`.

The lineup script is `scripts/cinematic-hero/render_lineup.py`. It reads the G90, the M4 Widebody, and `gt3-ccby/bmw-m4-gt3-evo-mattdoesblender.glb`. It does not read the VTX GT3. Frames under `assets/hero/renders/` are gitignored.

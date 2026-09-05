# Third-party assets

`Resources/Fonts/NotoSansTC-Subset.ttf` is a static 500-weight subset of
Google Fonts' Noto Sans TC variable font. It contains the Traditional Chinese,
Latin, number, punctuation, and arrow glyphs used by the phone HUD.

- Upstream: https://github.com/google/fonts/tree/main/ofl/notosanstc
- Upstream font: `NotoSansTC[wght].ttf`
- License: SIL Open Font License 1.1; see `NotoSansTC-OFL.txt`
- Local subset SHA-256: `adc62af3f2f90731d8652697432e182b139738213f590bae215e46123017cec3`

The subset was produced with FontTools by instancing `wght=500` and retaining
only the glyphs referenced by `MobileHud.cs` plus printable ASCII.

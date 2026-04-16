# Assets Generation Required

## Status

The icon design has been completed in `App/Sources/Design/IconDesign.md`, but the actual PNG files need to be generated on macOS.

## Required PNG Files

### Menu Bar Icon
- `MenuBarIcon.imageset/menubar_icon.png` (16x16px)
- `MenuBarIcon.imageset/menubar_icon@2x.png` (32x32px)

### App Icon
- `AppIcon.appiconset/icon_16x16.png` through `icon_512x512@2x.png` (10 files)

## Generation Options

**Option 1: Using macOS command-line (librsvg)**
```bash
# Install librsvg
brew install librsvg

# Navigate to design directory
cd App/Sources/Design

# Follow instructions in IconDesign.md to generate all required sizes
```

**Option 2: Using Sketch/Figma/Illustrator**
1. Import SVG templates from IconDesign.md
2. Export at required sizes
3. Place in appropriate directories

**Option 3: Online converter**
- Use https://cloudconvert.com/svg-to-png
- Export at required dimensions

## Development Note

Xcode will show asset warnings until these PNGs are generated, but the app will still build. Icon generation should be completed before final distribution on macOS.

# MusicianStream Icon Design

## Menu Bar Icon (16x16pt @2x)

**Design Concept:** Simple waveform representation - three vertical bars of varying heights representing the three audio channels (Piano L, Piano R, Mic), rendered as a monochrome template icon for macOS menu bar.

**Specifications:**
- Size: 16x16pt (@1x), 32x32px (@2x)
- Format: PNG with transparency
- Style: Monochrome (will adapt to light/dark menu bar)
- Template rendering: Yes (configured in Contents.json)

### Visual Design

```
Height values for 16x16pt canvas:
Bar 1 (Piano L):  12pt tall, 2pt wide, starting at y=4
Bar 2 (Piano R):  10pt tall, 2pt wide, starting at y=6
Bar 3 (Mic):      14pt tall, 2pt wide, starting at y=2

Spacing: 2pt between bars
Total width: (2+2+2) + (2+2) = 10pt, centered in 16pt canvas (3pt margin on each side)
```

### SVG Template (menubar_icon.svg)

```svg
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <!-- 16x16pt @2x = 32x32px -->
  <rect x="6" y="8" width="4" height="24" rx="1" fill="black"/>  <!-- Piano L: 12pt tall @2x -->
  <rect x="14" y="12" width="4" height="20" rx="1" fill="black"/> <!-- Piano R: 10pt tall @2x -->
  <rect x="22" y="4" width="4" height="28" rx="1" fill="black"/>  <!-- Mic: 14pt tall @2x -->
</svg>
```

### App Icon (Multi-size)

**Design Concept:** Same waveform design but with color gradient and larger sizes for application icon in Finder/Dock.

**Color Scheme:**
- Background: Deep charcoal gradient (#1a1a1a → #242424)
- Waveform bars: Copper accent (#d4845c) with subtle glow
- Border: Subtle inner shadow for depth

**Required Sizes:**
- 16x16 (@1x, @2x)
- 32x32 (@1x, @2x)
- 128x128 (@1x, @2x)
- 256x256 (@1x, @2x)
- 512x512 (@1x, @2x)

### SVG Template (app_icon.svg)

```svg
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#242424;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#e89c7b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d4845c;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="180" fill="url(#bgGradient)"/>

  <!-- Waveform bars (scaled up, centered) -->
  <rect x="256" y="256" width="128" height="768" rx="32" fill="url(#waveformGradient)" filter="url(#glow)"/>
  <rect x="448" y="320" width="128" height="640" rx="32" fill="url(#waveformGradient)" filter="url(#glow)"/>
  <rect x="640" y="192" width="128" height="896" rx="32" fill="url(#waveformGradient)" filter="url(#glow)"/>
</svg>
```

## Generation Instructions

Since PNG generation requires external tools on macOS:

**Option 1: Using Sketch/Figma/Illustrator**
1. Import the SVG templates above
2. Export at required sizes with transparency
3. Place in appropriate .xcassets directories

**Option 2: Using macOS command-line (requires librsvg)**
```bash
# Install librsvg if not present
brew install librsvg

# Generate menu bar icon
rsvg-convert -w 16 -h 16 menubar_icon.svg > menubar_icon.png
rsvg-convert -w 32 -h 32 menubar_icon.svg > menubar_icon@2x.png

# Generate app icons
for size in 16 32 128 256 512; do
  rsvg-convert -w $size -h $size app_icon.svg > icon_${size}x${size}.png
  rsvg-convert -w $((size*2)) -h $((size*2)) app_icon.svg > icon_${size}x${size}@2x.png
done
```

**Option 3: Using online converter**
- Upload SVG to https://cloudconvert.com/svg-to-png
- Export at required dimensions
- Download and place in .xcassets directories

## Placeholder Files

For development without actual PNG files, Xcode will show warnings but the app will build. The actual icon generation should be done before final distribution.

To suppress Xcode warnings during development, you can create 1x1 transparent placeholder PNGs:

```bash
# Create transparent 1x1 placeholder (requires ImageMagick)
convert -size 1x1 xc:transparent placeholder.png

# Copy to all required locations
for file in menubar_icon.png menubar_icon@2x.png icon_*.png; do
  cp placeholder.png "$file"
done
```

## Visual Hierarchy

The three-bar waveform design:
1. **Instantly recognizable** as audio-related
2. **Distinct from generic audio icons** (not headphones, not speaker)
3. **Works at tiny sizes** (menu bar 16x16pt)
4. **Scales well** to larger app icon sizes
5. **Represents the app's function** - three audio channels being visualized

The varying heights create visual interest while maintaining symmetry and balance. The copper accent color ties into the app's overall professional studio aesthetic.

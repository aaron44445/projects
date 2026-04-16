# MusicianStream

A macOS HAL audio driver that creates a virtual input device by summing Piano (channels 1-2) + Mic (channel 3) with soft-limiting for video calls.

## Features

- **Auto-Latching:** Automatically detects system default input at startup
- **Stereo Mode:** L = Piano L + Mic, R = Piano R + Mic
- **Mono Mode:** L = R = Piano L + Piano R + Mic
- **Soft Limiter:** Prevents clipping with adjustable threshold (-6 to 0 dB, default -1 dB)
- **Menu Bar App:** Simple controls for mode and limiter threshold
- **Settings Persistence:** Remembers your preferences across restarts

## Requirements

- macOS 14.0 (Sonoma) or later
- Xcode 15.0 or later (for building)
- Audio interface with at least 2 channels (3 recommended: Piano L+R, Mic)

## Quick Start

### Building

See [docs/BUILDING.md](docs/BUILDING.md) for detailed build instructions.

```bash
# Build driver
cd Driver
xcodebuild -project MusicianStream.xcodeproj -configuration Release

# Build app
cd ../App
xcodebuild -project MusicianStream.xcodeproj -configuration Release
```

### Installation

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for detailed installation instructions.

```bash
# Install driver
sudo cp -r Driver/build/Release/MusicianStream.driver /Library/Audio/Plug-Ins/HAL/
sudo killall coreaudiod

# Install app
cp -r App/build/Release/MusicianStream.app /Applications/
open /Applications/MusicianStream.app
```

## Usage

1. Launch MusicianStream from Applications
2. Click the menu bar icon (waveform)
3. Adjust mode (Stereo/Mono) and limiter threshold as needed
4. In your video call app (Zoom, Discord, etc.), select "MusicianStream" as input device

## Architecture

- **Driver:** C++ HAL plugin using Apple's AudioServerPlugIn API
- **App:** Swift/SwiftUI menu bar application
- **Communication:** XPC for driver-app messaging
- **Audio Processing:** Lookahead soft limiter with exponential attack/release

See [docs/superpowers/specs/2026-04-16-musicianstream-design.md](docs/superpowers/specs/2026-04-16-musicianstream-design.md) for complete design documentation.

## Project Structure

```
MusicianStream/
├── Driver/                  # C++ HAL plugin
│   ├── Source/
│   │   ├── PluginInterface.cpp  # AudioServerPlugIn implementation
│   │   ├── DeviceManager.cpp    # Physical device detection
│   │   ├── AudioProcessor.cpp   # Channel summing + limiting
│   │   ├── Limiter.cpp          # Lookahead soft limiter
│   │   ├── XPCService.cpp       # XPC listener
│   │   └── Types.h              # Shared types & constants
│   └── Tests/               # Unit tests
│
├── App/                     # Swift/SwiftUI app
│   ├── Sources/
│   │   ├── AppDelegate.swift          # Lifecycle management
│   │   ├── MusicianStreamApp.swift    # App entry point
│   │   ├── MenuBarController.swift    # Status item & popover
│   │   ├── Views/PopoverMenuView.swift  # Main UI
│   │   ├── Design/ColorPalette.swift  # Studio aesthetic colors
│   │   ├── XPCClient.swift            # Driver communication
│   │   ├── SettingsManager.swift      # UserDefaults persistence
│   │   └── Models.swift               # Data models
│   └── Resources/
│       ├── Assets.xcassets    # Icons (requires generation)
│       └── Info.plist         # App configuration
│
├── Shared/
│   └── XPCProtocol.h        # XPC message definitions
│
└── docs/
    ├── BUILDING.md          # Build instructions
    ├── INSTALLATION.md      # Installation guide
    ├── testing/integration-test-plan.md  # Test procedures
    └── superpowers/
        ├── specs/2026-04-16-musicianstream-design.md   # Full design spec
        └── plans/2026-04-16-musicianstream.md          # Implementation plan
```

## Known Limitations

### Audio Routing
The current implementation outputs silence in `DoIOOperation`. Full audio routing (reading from physical device and processing through AudioProcessor) requires macOS-specific IOProc integration. This is expected for cross-platform development on Windows - completion requires macOS environment.

### Icon Assets
The asset catalog has manifests but no PNG files. Icon generation requires macOS tools. See `App/Resources/Assets.xcassets/README.md` and `App/Sources/Design/IconDesign.md` for generation instructions.

## Testing

Run the integration test suite:
```bash
# See docs/testing/integration-test-plan.md
```

Tests must be performed on macOS. Includes:
- Driver recognition
- XPC communication
- Settings persistence
- Video call integration
- Multi-app routing

## Troubleshooting

### Driver doesn't appear in Sound Settings
```bash
sudo killall coreaudiod
# Check Console.app for errors (filter: "MusicianStream")
```

### App shows "Driver Not Loaded"
1. Verify driver is installed: `ls /Library/Audio/Plug-Ins/HAL/`
2. Restart coreaudiod: `sudo killall coreaudiod`
3. Restart the app

### No audio in video calls
- Verify system default input has audio (speak into mic)
- Check Console.app for buffer underrun warnings
- **Note:** Current implementation outputs silence (audio routing not complete)

### App won't launch
- Check macOS version: `sw_vers` (must be 14.0+)
- Verify app is in /Applications/
- Check Console.app for launch errors

### Debugging
View driver logs:
```bash
log show --predicate 'subsystem == "com.musicianstream.driver"' --last 5m
```

## License

Personal use only. Not licensed for distribution.

## Author

Jeremy Harvey

**Co-Authored-By:** Claude Sonnet 4.5 <noreply@anthropic.com>

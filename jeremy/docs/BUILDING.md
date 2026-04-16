# Building MusicianStream

## Prerequisites

- macOS 14.0 (Sonoma) or later
- Xcode 15.0 or later
- Command Line Tools: `xcode-select --install`

## Project Structure

```
MusicianStream/
├── Driver/           # C++ HAL plugin
├── App/              # Swift/SwiftUI menu bar app
└── Shared/           # XPC protocol definitions
```

## Building the Driver

```bash
cd Driver
xcodebuild -project MusicianStream.xcodeproj \
           -configuration Release \
           -arch x86_64 -arch arm64 \
           ONLY_ACTIVE_ARCH=NO
```

**Output:** `Driver/build/Release/MusicianStream.driver`

### Driver Build Settings

- **Deployment Target:** macOS 14.0
- **Architectures:** x86_64, arm64 (Universal Binary)
- **Frameworks:** CoreAudio.framework, CoreFoundation.framework
- **C++ Standard:** C++17
- **Bundle Type:** Audio HAL Plugin (`.driver`)

### Driver Components

The driver build includes:
- `PluginInterface.cpp` - AudioServerPlugIn entry point and callbacks
- `DeviceManager.cpp` - System default input device detection
- `AudioProcessor.cpp` - Channel summing and audio routing
- `Limiter.cpp` - Lookahead soft limiter algorithm
- `XPCService.cpp` - XPC Mach service listener
- `Types.h` - Shared constants and types

## Building the App

```bash
cd App
xcodebuild -project MusicianStream.xcodeproj \
           -configuration Release
```

**Output:** `App/build/Release/MusicianStream.app`

### App Build Settings

- **Deployment Target:** macOS 14.0
- **Architectures:** x86_64, arm64
- **Swift Version:** 5.9
- **UI Framework:** SwiftUI
- **App Type:** LSUIElement (runs in menu bar only)
- **Bundle Identifier:** com.musicianstream.app

### App Components

The app build includes:
- `AppDelegate.swift` - Lifecycle management
- `MusicianStreamApp.swift` - Entry point
- `MenuBarController.swift` - Status bar integration
- `PopoverMenuView.swift` - UI with professional studio aesthetic
- `XPCClient.swift` - Driver communication
- `SettingsManager.swift` - UserDefaults persistence

## Development Build

For development with faster iteration and debugging:

```bash
# Driver (Debug)
cd Driver
xcodebuild -project MusicianStream.xcodeproj -configuration Debug

# App (Debug)
cd ../App
xcodebuild -project MusicianStream.xcodeproj -configuration Debug
```

### Debug Build Features

- More verbose logging (os_log with debug level)
- Assertions enabled
- No optimizations
- Debug symbols included
- Faster compilation

## Running Tests

### Driver Unit Tests

```bash
cd Driver

# Test limiter algorithm
clang++ -std=c++17 \
    -I/System/Library/Frameworks/CoreAudio.framework/Headers \
    Tests/LimiterTests.cpp \
    Source/Limiter.cpp \
    -o test_limiter
./test_limiter

# Test audio processor
clang++ -std=c++17 \
    -I/System/Library/Frameworks/CoreAudio.framework/Headers \
    Tests/AudioProcessorTests.cpp \
    Source/AudioProcessor.cpp \
    Source/Limiter.cpp \
    -o test_processor
./test_processor
```

**Expected output:** All tests should pass with summary counts.

### App Tests

```bash
cd App
xcodebuild test \
    -project MusicianStream.xcodeproj \
    -scheme MusicianStream
```

**Note:** SwiftUI tests require Xcode test environment.

### Integration Tests

See [testing/integration-test-plan.md](testing/integration-test-plan.md) for complete integration testing procedures. Integration tests must be performed manually on macOS after installation.

## Cleaning Build Artifacts

```bash
# Clean driver
cd Driver
xcodebuild clean

# Clean app
cd ../App
xcodebuild clean

# Remove build directories completely
rm -rf Driver/build
rm -rf App/build
```

## Troubleshooting Build Issues

### Command Line Tools Not Found

```bash
xcode-select --install
```

If already installed, verify path:
```bash
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer
```

### SDK Not Found

Open Xcode → Settings → Locations → Command Line Tools and select the latest Xcode version.

Or via command line:
```bash
sudo xcode-select --switch /Applications/Xcode.app
```

### Architecture Mismatch

Ensure `ONLY_ACTIVE_ARCH=NO` for universal binary builds:
```bash
xcodebuild -project Driver/MusicianStream.xcodeproj \
           -configuration Release \
           ONLY_ACTIVE_ARCH=NO \
           -arch x86_64 -arch arm64
```

Check current architecture settings:
```bash
xcodebuild -project Driver/MusicianStream.xcodeproj \
           -showBuildSettings | grep ARCHS
```

### Linker Errors (CoreAudio Framework)

Verify framework is linked:
1. Open project in Xcode
2. Select target → Build Phases
3. Check "Link Binary With Libraries" contains:
   - CoreAudio.framework
   - CoreFoundation.framework
   - (App also needs AppKit.framework)

### Missing Header Files

If you see "file not found" errors for system headers:
```bash
# Verify SDK path
xcrun --show-sdk-path

# Should output something like:
# /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX14.0.sdk
```

### Swift Version Mismatch

The app requires Swift 5.9+. Check your Swift version:
```bash
swift --version
# Should show: Swift version 5.9.x or higher
```

Update Xcode if needed to get the latest Swift version.

## Development Workflow

Recommended iterative development flow:

### 1. Make Changes
Edit source files in your preferred editor or Xcode.

### 2. Run Unit Tests
```bash
cd Driver
./test_limiter && ./test_processor
```

### 3. Build Driver
```bash
xcodebuild -project Driver/MusicianStream.xcodeproj -configuration Debug
```

### 4. Install Driver
```bash
sudo cp -r Driver/build/Debug/MusicianStream.driver /Library/Audio/Plug-Ins/HAL/
sudo killall coreaudiod
```

**Note:** coreaudiod restart is required for driver changes to take effect.

### 5. Build App
```bash
xcodebuild -project App/MusicianStream.xcodeproj -configuration Debug
```

### 6. Test App
```bash
open App/build/Debug/MusicianStream.app
```

### 7. Check Logs
```bash
# Driver logs
log show --predicate 'subsystem == "com.musicianstream.driver"' --last 1m

# App logs (if needed)
log show --predicate 'subsystem == "com.musicianstream.app"' --last 1m
```

### 8. Debug with Console.app
1. Open Console.app
2. Filter by "MusicianStream"
3. Monitor logs in real-time during testing

## Build Performance Tips

### Parallel Builds
Xcodebuild uses multiple cores by default. To explicitly set:
```bash
xcodebuild -jobs 8 -project MusicianStream.xcodeproj
```

### Incremental Builds
Avoid `clean` unless necessary - Xcode's incremental builds are fast.

### Build Time Profiling
```bash
xcodebuild -project Driver/MusicianStream.xcodeproj \
           -configuration Debug \
           OTHER_SWIFT_FLAGS="-Xfrontend -debug-time-function-bodies"
```

## Advanced Build Options

### Custom Build Directory
```bash
xcodebuild -project MusicianStream.xcodeproj \
           CONFIGURATION_BUILD_DIR=~/Desktop/Builds
```

### Verbose Output
```bash
xcodebuild -project MusicianStream.xcodeproj \
           -configuration Release \
           -verbose
```

### Show Build Settings
```bash
xcodebuild -project MusicianStream.xcodeproj \
           -showBuildSettings
```

## Continuous Integration

For automated builds (CI/CD):

```bash
#!/bin/bash
set -e  # Exit on error

# Build driver
cd Driver
xcodebuild -project MusicianStream.xcodeproj \
           -configuration Release \
           -arch x86_64 -arch arm64 \
           ONLY_ACTIVE_ARCH=NO

# Run driver tests
cd Tests
clang++ -std=c++17 ../Tests/LimiterTests.cpp ../Source/Limiter.cpp -o test_limiter
./test_limiter

# Build app
cd ../../App
xcodebuild -project MusicianStream.xcodeproj \
           -configuration Release

# Create distribution package
cd ..
mkdir -p dist
cp -r Driver/build/Release/MusicianStream.driver dist/
cp -r App/build/Release/MusicianStream.app dist/
tar -czf dist/MusicianStream-$(date +%Y%m%d).tar.gz dist/
```

## Distribution Build

For distributing to other users (requires code signing):

```bash
# Sign driver
codesign --sign "Developer ID Application" \
         Driver/build/Release/MusicianStream.driver

# Sign app
codesign --sign "Developer ID Application" \
         --deep --force \
         App/build/Release/MusicianStream.app

# Verify signatures
codesign --verify --verbose App/build/Release/MusicianStream.app
spctl --assess --verbose App/build/Release/MusicianStream.app
```

**Note:** Personal use does not require code signing. Distribution requires Apple Developer account.

## Next Steps

After successful build:
1. Follow [INSTALLATION.md](INSTALLATION.md) to install
2. Run integration tests from [testing/integration-test-plan.md](testing/integration-test-plan.md)
3. Configure your video call software to use MusicianStream as input

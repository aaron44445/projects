# MusicianStream Integration Test Plan

**Status:** Ready for testing on macOS
**Platform:** macOS 14.0 (Sonoma) or later
**Prerequisites:** Xcode build environment, physical audio interface

## Overview

This document outlines the integration testing procedures for MusicianStream, a macOS HAL audio driver with menu bar app. Testing must be performed on macOS as the driver uses platform-specific CoreAudio APIs.

## Test Environment Setup

### 1. Build Both Components

```bash
# Build driver
cd Driver
xcodebuild -project MusicianStream.xcodeproj -configuration Release

# Build app
cd ../App
xcodebuild -project MusicianStream.xcodeproj -configuration Release
```

### 2. Install Driver

```bash
sudo cp -r Driver/build/Release/MusicianStream.driver /Library/Audio/Plug-Ins/HAL/
sudo killall coreaudiod
```

**Expected:** coreaudiod restarts, driver loads without errors

---

## Test Cases

### Test 1: Driver Recognition
**Objective:** Verify macOS recognizes the MusicianStream driver

**Steps:**
1. Open System Settings → Sound → Input
2. Look for "MusicianStream" in the input device list

**Expected Results:**
- ✓ MusicianStream appears in device list
- ✓ Device is selectable
- ✓ Device shows as available (not grayed out)

**Debugging:** If driver doesn't appear, check Console.app for coreaudiod errors

---

### Test 2: Menu Bar App Launch
**Objective:** Verify app launches and displays UI

**Steps:**
1. Launch `App/build/Release/MusicianStream.app`
2. Check for icon in menu bar (may be on right side near system icons)
3. Click icon to open popover

**Expected Results:**
- ✓ App launches without crashing
- ✓ Icon appears in menu bar (waveform icon)
- ✓ Popover opens showing full UI
- ✓ Device name displays latched device (e.g., "Rubix 44")
- ✓ Activity indicator shows connection status (copper dot if active)

**Known Issues:**
- If icon doesn't show, check if app is running in Activity Monitor
- If "Driver Not Loaded" error, verify driver installation

---

### Test 3: XPC Communication
**Objective:** Verify app ↔ driver communication

**Steps:**
1. With popover open, note current mode and threshold
2. Open Console.app, filter for "MusicianStream"
3. Toggle mode (Stereo ↔ Mono)
4. Adjust limiter threshold slider
5. Observe Console logs

**Expected Results:**
- ✓ Mode changes logged in Console
- ✓ Threshold changes logged in Console
- ✓ No XPC connection errors
- ✓ Status updates reflect changes immediately

**Test Data:**
- Initial mode: Stereo (default)
- Test mode: Switch to Mono, then back to Stereo
- Initial threshold: -1.0 dB (default)
- Test threshold: Adjust to -3.0 dB, then to -0.5 dB

---

### Test 4: Settings Persistence
**Objective:** Verify settings survive app restart

**Steps:**
1. Set mode to Mono
2. Set threshold to -3.0 dB
3. Quit app completely
4. Relaunch app
5. Open popover

**Expected Results:**
- ✓ Mode is still Mono after restart
- ✓ Threshold is still -3.0 dB after restart
- ✓ No errors in Console during load

**Files to check:** `~/Library/Preferences/com.musicianstream.app.plist` should exist

---

### Test 5: Device Auto-Latching
**Objective:** Verify driver latches to system default input

**Steps:**
1. Note current system default input device (System Settings → Sound)
2. Restart coreaudiod: `sudo killall coreaudiod`
3. Open MusicianStream app
4. Check device name in popover

**Expected Results:**
- ✓ Device name matches system default input
- ✓ No errors if device has 3+ channels
- ⚠️ "Unknown" or fallback if device has < 3 channels (graceful degradation)

---

### Test 6: Video Call Integration
**Objective:** Verify MusicianStream works as input in real apps

**Steps:**
1. Open Zoom or Discord
2. Go to Audio Settings
3. Select "MusicianStream" as microphone/input
4. Start test call or audio check
5. Speak into mic, play piano keys

**Expected Results:**
- ✓ Zoom/Discord recognizes MusicianStream
- ✓ Input level meters respond (if audio routing implemented)
- ⚠️ May transmit silence if DoIOOperation not fully implemented

**Known Limitation:** Current implementation outputs silence in DoIOOperation. Full audio routing requires additional platform-specific implementation.

---

### Test 7: Multi-App Audio Routing
**Objective:** Verify multiple apps can use driver simultaneously

**Steps:**
1. Open Zoom, select MusicianStream as input
2. Open Discord, select MusicianStream as input
3. Check Console for errors

**Expected Results:**
- ✓ Both apps can select device
- ✓ No "device busy" errors
- ✓ Driver handles multiple clients gracefully

---

### Test 8: System Integration
**Objective:** Verify driver behaves correctly at system level

**Steps:**
1. Check driver shows in `system_profiler SPAudioDataType`
2. Check driver appears in Audio MIDI Setup.app
3. Verify driver unloads cleanly (quit all apps, remove driver, killall coreaudiod)

**Expected Results:**
- ✓ Driver listed in system profiler output
- ✓ Device visible in Audio MIDI Setup with correct properties
- ✓ Clean removal without system warnings

---

## Known Limitations (Current Implementation)

1. **Audio Routing Not Fully Implemented**
   - `DoIOOperation` outputs silence
   - Real audio requires platform-specific IOProc integration
   - This is expected for cross-platform development on Windows

2. **No Icon PNGs Generated**
   - Asset catalog has manifests but no actual PNG files
   - Icon generation requires macOS tools (see `App/Resources/Assets.xcassets/README.md`)
   - App will show placeholder icon until assets are generated

3. **Limited Error Handling**
   - Device disconnection not fully handled
   - Channel count mismatch needs testing
   - Format mismatch scenarios need validation

---

## Test Results Template

**Date:** [YYYY-MM-DD]
**Tester:** [Name]
**macOS Version:** [14.x]
**Hardware:** [Audio interface model]

| Test Case | Status | Notes |
|-----------|--------|-------|
| Driver Recognition | ⚠️ / ✓ / ✗ | |
| Menu Bar App Launch | ⚠️ / ✓ / ✗ | |
| XPC Communication | ⚠️ / ✓ / ✗ | |
| Settings Persistence | ⚠️ / ✓ / ✗ | |
| Device Auto-Latching | ⚠️ / ✓ / ✗ | |
| Video Call Integration | ⚠️ / ✓ / ✗ | |
| Multi-App Routing | ⚠️ / ✓ / ✗ | |
| System Integration | ⚠️ / ✓ / ✗ | |

**Legend:**
- ✓ Pass
- ⚠️ Pass with known limitations
- ✗ Fail

---

## Debugging Tips

### Driver Not Loading
- Check Console.app for "coreaudiod" process errors
- Verify driver bundle structure: `ls -R /Library/Audio/Plug-Ins/HAL/MusicianStream.driver`
- Check Info.plist is valid: `plutil -lint /Library/Audio/Plug-Ins/HAL/MusicianStream.driver/Contents/Info.plist`

### App Can't Connect to Driver
- Verify XPC service name matches: `com.musicianstream.driver.xpc`
- Check driver actually loaded: Look for plugin initialization logs
- Try restarting both app and coreaudiod

### No Audio Output
- Expected in current implementation
- Check Console for "MusicianStream IO started" log
- Verify physical device has audio (test with another app)

### Popover Doesn't Show
- Check if LSUIElement is set correctly in Info.plist
- Try clicking menu bar icon multiple times
- Restart app

---

## Next Steps After Testing

1. **Implement Full Audio Routing**
   - Wire up DeviceManager → AudioProcessor → Output
   - Test with real audio interface (Piano + Mic setup)

2. **Generate Icon Assets**
   - Follow instructions in `App/Sources/Design/IconDesign.md`
   - Use rsvg or design tools to create PNGs

3. **Performance Testing**
   - Measure CPU usage during active streaming
   - Test limiter with hot signals (near clipping)
   - Validate latency is acceptable (< 20ms)

4. **Edge Case Testing**
   - Device hot-unplug/replug during streaming
   - Sample rate changes
   - Channel count mismatches
   - Multiple simultaneous drivers

5. **Distribution Preparation**
   - Codesigning for distribution outside personal use
   - Installer package creation
   - Notarization for Gatekeeper compatibility

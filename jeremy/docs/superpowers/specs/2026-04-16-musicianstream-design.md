# MusicianStream - macOS HAL Audio Driver Design

**Date:** 2026-04-16
**Status:** Approved
**Author:** Jeremy Harvey

## Overview

MusicianStream is a macOS HAL Audio Server Plug-in (virtual audio driver) that creates a virtual input device for video calls and phone calls. It automatically latches onto the system default input device, sums audio from the first 3 channels (Piano on channels 1-2 stereo, Mic on channel 3 mono), applies soft-limiting to prevent clipping, and presents a stereo virtual input that any application can use.

## Requirements Summary

### Core Features
- **Auto-Latching:** Automatically detect the current system default input device at startup and pull audio from its first 3 channels
- **Summing Logic:**
  - Stereo Mode: Virtual L = Physical 1 + Physical 3, Virtual R = Physical 2 + Physical 3
  - Mono Mode: Virtual L = Virtual R = Physical 1 + Physical 2 + Physical 3
- **Safety:** Soft-limiter to prevent digital clipping when all channels are active
- **UI:** Menu bar app with stereo/mono toggle, limiter threshold control, and device status display

### Technical Requirements
- macOS 14+ (Sonoma/Sequoia)
- Match physical device audio format (sample rate and bit depth)
- Balanced latency/stability (moderate buffer sizes)
- Personal use (no codesigning/notarization required)
- Settings persistence across restarts
- Device name: "MusicianStream"
- Default limiter threshold: -1 dBFS

## Architecture

### High-Level Design

The system consists of two main components:

**1. HAL Audio Driver (`MusicianStream.driver`)**
- C++ plugin bundle installed in `/Library/Audio/Plug-Ins/HAL/`
- Implements Apple's AudioServerPlugIn API to create a virtual input device
- On load, queries the current system default input device and latches onto it
- Reads audio from the physical device's first 3 channels (or fewer if unavailable)
- Performs real-time summing and soft-limiting
- Presents a stereo virtual input that any app can use

**2. Menu Bar App (`MusicianStream.app`)**
- Swift/SwiftUI application that runs in the menu bar
- Shows current latched device name
- Provides stereo/mono mode toggle
- Provides limiter threshold slider (-6 dB to 0 dB range, default -1 dB)
- Persists settings to UserDefaults
- Communicates with driver via XPC service to change settings

**Communication Flow:**
- App sends settings changes → XPC → Driver updates processing parameters
- Driver operates independently; app is just a control interface
- If app isn't running, driver continues with last saved settings

## Component Design

### HAL Plugin Component

The driver implements these key AudioServerPlugIn callbacks:

#### Initialization (`AudioServerPlugInCreate`)
- Queries CoreAudio for the current system default input device using `kAudioHardwarePropertyDefaultInputDevice`
- Opens that physical device and inspects its format (sample rate, bit depth, channel count)
- Creates the virtual "MusicianStream" device with matching format but fixed 2-channel stereo output
- Loads last saved settings from shared plist file in `~/Library/Preferences/`

#### Audio Processing (`ReadInputData` callback)
- Pulls audio frames from the physical device's IOProc
- Routes channels based on current mode:
  - **Stereo mode:** L = Physical[0] + Physical[2], R = Physical[1] + Physical[2]
  - **Mono mode:** L = R = Physical[0] + Physical[1] + Physical[2]
- Applies soft-limiter with adjustable threshold
- Outputs stereo frames to the virtual device buffer

#### Property Management
- Implements `kAudioObjectPropertyName` → returns "MusicianStream"
- Implements `kAudioDevicePropertyDeviceNameCFString` → returns "MusicianStream"
- Supports standard device properties (sample rate, format, channel layout)

#### XPC Service Listener
- Embeds an XPC listener that the menu bar app connects to
- Receives commands: `setMode(stereo/mono)`, `setLimiterThreshold(dB)`
- Updates processing parameters atomically (lock-free if possible)

### Menu Bar App Component

**Technology Stack:**
- SwiftUI for the interface
- AppKit's NSStatusBar for menu bar presence
- Combine for reactive state management
- XPC for driver communication

**UI Structure:**

Menu Bar Icon:
- Shows a small audio waveform or microphone icon
- Clicking opens a popover menu

Popover Menu:
```
┌─────────────────────────────┐
│ MusicianStream              │
├─────────────────────────────┤
│ Device: Rubix 44            │ ← Shows latched device
│                             │
│ Mode: ◉ Stereo  ○ Mono     │ ← Radio buttons
│                             │
│ Limiter: -1.0 dB           │ ← Slider (-6 to 0 dB)
│ ────────●──────────        │
│                             │
│ Quit                        │
└─────────────────────────────┘
```

**Settings Persistence:**
- Saves to `UserDefaults` (writes to `~/Library/Preferences/com.musicianstream.app.plist`)
- Keys: `audioMode` (string: "stereo"/"mono"), `limiterThreshold` (float: -6.0 to 0.0)
- Reads on launch, applies via XPC to driver

**XPC Client:**
- Connects to driver's XPC service on launch
- Sends messages when user changes settings
- Handles connection failures gracefully (shows "Driver not loaded" if can't connect)

**App Lifecycle:**
- Launches at login (optional, user can enable via System Settings)
- Runs in background (`LSUIElement = YES` to hide from Dock)
- Quit option in menu

## Audio Processing Pipeline

### Channel Routing & Summing

**Stereo Mode:**
```
virtualLeft  = physical[0] + physical[2]  // Piano L + Mic
virtualRight = physical[1] + physical[2]  // Piano R + Mic
```

**Mono Mode:**
```
monoSum = physical[0] + physical[1] + physical[2]  // All three summed
virtualLeft  = monoSum
virtualRight = monoSum  // Mirrored for mono compatibility
```

**Graceful Channel Handling:**
- If physical device has < 3 channels, use what's available
- Example: 2 channels → sum both to L and R
- Example: 1 channel → duplicate to both L and R
- If 0 channels or device disconnected → output silence

### Soft Limiter Implementation

Uses a **lookahead limiter** to prevent clipping:

1. **Detection:** Look ahead 5ms (~240 samples at 48kHz) to detect peaks above threshold
2. **Gain Reduction:** Calculate required gain reduction to keep peaks at threshold
3. **Smoothing:** Apply gain reduction with attack (0.5ms) and release (50ms) envelopes
4. **Application:** Apply smoothed gain to current samples

**Algorithm Parameters:**
- Attack time: 0.5ms (fast enough to catch transients)
- Release time: 50ms (gradual return to prevent pumping)
- Lookahead buffer: 5ms (gives time to react before clip)
- Threshold: adjustable via menu bar app (-6 dB to 0 dB)

This prevents harsh clipping while maintaining loudness and natural dynamics.

## Communication Layer (XPC)

### XPC Service Architecture

The driver embeds an XPC listener, and the app acts as the client.

**Messages from App → Driver:**
- `setAudioMode(mode: String)` - "stereo" or "mono"
- `setLimiterThreshold(dB: Float)` - -6.0 to 0.0
- `getStatus() → Response` - Returns current device info

**Response from Driver → App:**
```json
{
  "latchedDeviceName": "Rubix 44",
  "currentMode": "stereo",
  "limiterThreshold": -1.0,
  "isActive": true
}
```

**Implementation Details:**

**In the Driver (C++):**
- Uses `xpc_connection_create_mach_service()` to create listener
- Handles incoming XPC messages on a dedicated thread
- Updates shared atomic variables that the audio processing callback reads
- No locks in the audio thread - uses lock-free atomics or memory barriers

**In the App (Swift):**
- Uses `NSXPCConnection` to connect to the driver's Mach service
- Connection name: `com.musicianstream.driver.xpc`
- Reconnects automatically if connection drops
- Shows UI error state if can't connect

**Thread Safety:**
- Audio processing runs on real-time thread (can't block)
- XPC messages arrive on separate thread
- Settings changes use atomic operations or triple-buffering to avoid locks

## Error Handling

### Driver-Level Error Handling

**Device Not Found:**
- If system default input device query fails → log error, create virtual device anyway but output silence
- Show "No Input Device" in app's status

**Format Mismatch:**
- If physical device uses unsupported format → fall back to 48kHz/32-bit float
- Log warning but continue operating

**Buffer Underruns:**
- If physical device doesn't provide samples in time → fill with zeros (silence) for that cycle
- Increment underrun counter (exposed via XPC for debugging)

**Channel Count Mismatch:**
- Use available channels, pad with silence if needed
- Handled gracefully by summing logic

**Physical Device Disconnected:**
- Detect via IOProc error codes
- Switch to outputting silence
- Update app status: "Device Disconnected"
- Don't crash or stop the driver - allows graceful recovery when device reconnects

### App-Level Error Handling

**XPC Connection Failed:**
- Show "Driver Not Loaded" in menu bar status
- Disable controls (grayed out)
- Show helper text: "Install driver or restart coreaudiod"

**Invalid Settings:**
- Clamp slider values to valid range (-6 to 0 dB)
- Validate mode string before sending to driver

**Logging:**
- Driver logs to system log using `os_log` with subsystem `com.musicianstream.driver`
- App logs to unified logging
- Errors include context (device name, format, error codes)

**User-Facing Errors:**
- Keep messages simple: "Audio device not found", "Driver not loaded"
- Provide actionable next steps where possible

## Build & Installation

### Project Structure

```
MusicianStream/
├── Driver/
│   ├── MusicianStream.driver/           # HAL plugin bundle
│   │   ├── Contents/
│   │   │   ├── Info.plist              # Bundle metadata
│   │   │   └── MacOS/
│   │   │       └── MusicianStream      # C++ binary
│   ├── Source/
│   │   ├── PluginInterface.cpp         # AudioServerPlugIn implementation
│   │   ├── AudioProcessor.cpp          # Summing + limiter
│   │   ├── DeviceManager.cpp           # Physical device I/O
│   │   ├── XPCService.cpp              # XPC listener
│   │   └── Limiter.cpp                 # Soft limiter algorithm
│   └── MusicianStream.xcodeproj
│
├── App/
│   ├── MusicianStream.xcodeproj
│   ├── Sources/
│   │   ├── AppDelegate.swift           # App lifecycle
│   │   ├── MenuBarController.swift     # Status bar management
│   │   ├── SettingsView.swift          # Popover UI
│   │   ├── XPCClient.swift             # Driver communication
│   │   └── Models.swift                # Data models
│   └── Resources/
│       ├── Assets.xcassets              # Icons
│       └── Info.plist
│
├── Shared/
│   └── XPCProtocol.h                    # Shared XPC message definitions
│
└── README.md
```

### Build Process

**Driver (C++):**
- Xcode project targeting x86_64 + arm64 (Universal Binary)
- Links against CoreAudio.framework, CoreFoundation.framework
- Outputs `.driver` bundle
- No codesigning needed for personal use

**App (Swift):**
- Standard Xcode project
- SwiftUI app, macOS 14+ deployment target
- Links XPCClient to driver's Mach service
- Build as universal binary

### Installation

**Manual Installation (for personal use):**
1. Copy `MusicianStream.driver` to `/Library/Audio/Plug-Ins/HAL/`
2. Restart `coreaudiod`: `sudo killall coreaudiod`
3. Copy `MusicianStream.app` to `/Applications/`
4. Launch app - it appears in menu bar

**Uninstallation:**
1. Quit app
2. Remove driver: `sudo rm -rf /Library/Audio/Plug-Ins/HAL/MusicianStream.driver`
3. Restart coreaudiod: `sudo killall coreaudiod`
4. Remove app from Applications

### Testing

**Unit Testing:**
- Test limiter algorithm with known waveforms
- Test channel routing logic
- Test XPC message handling

**Integration Testing:**
1. Install driver, verify it appears in Sound Settings
2. Launch app, verify connection to driver
3. Select MusicianStream in Zoom/Discord, verify audio works
4. Toggle modes, adjust limiter, verify changes apply
5. Test with different channel counts (unplug cables)
6. Test device disconnection/reconnection

**Development Tools:**
- `Audio MIDI Setup.app` to inspect device properties
- `system_profiler SPAudioDataType` to verify driver loads
- `Console.app` to view driver logs

## Success Criteria

The implementation will be considered successful when:

1. MusicianStream appears as a selectable input device in macOS Sound Settings
2. Zoom/Discord can use MusicianStream as an audio input
3. Piano (channels 1-2) and Mic (channel 3) are correctly summed in both stereo and mono modes
4. Soft limiter prevents clipping when all channels are active
5. Menu bar app successfully controls mode and limiter threshold
6. Settings persist across restarts
7. System handles graceful degradation (fewer channels, device disconnection)
8. Audio latency is acceptable for live performance (< 20ms round-trip)

## Future Enhancements (Out of Scope)

- Dynamic device switching (currently latches at startup only)
- Per-channel gain controls
- Visual level meters in menu bar app
- Multi-device aggregation
- VST/AU plugin support for effects chain
- Installer package with codesigning for distribution

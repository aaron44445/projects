# Installing MusicianStream

## Prerequisites

- macOS 14.0 (Sonoma) or later
- Administrator access (for driver installation)
- Built driver and app binaries (see [BUILDING.md](BUILDING.md))

## Installation Steps

### 1. Build the Project

Follow [BUILDING.md](BUILDING.md) to build both the driver and app:

```bash
# Build driver
cd Driver
xcodebuild -project MusicianStream.xcodeproj -configuration Release

# Build app
cd ../App
xcodebuild -project MusicianStream.xcodeproj -configuration Release
```

### 2. Install the Driver

Copy the driver bundle to the system HAL plugins directory:

```bash
sudo cp -r Driver/build/Release/MusicianStream.driver /Library/Audio/Plug-Ins/HAL/
```

**Important Notes:**
- You need administrator privileges (`sudo`) to install to `/Library/`
- The driver must be in the exact location `/Library/Audio/Plug-Ins/HAL/`
- Do not rename the `.driver` bundle

### 3. Restart Core Audio

```bash
sudo killall coreaudiod
```

This restarts the Core Audio daemon, which will detect and load the new driver. The restart is instantaneous and won't interrupt other audio applications.

### 4. Verify Driver Installation

Check if MusicianStream is loaded:

```bash
system_profiler SPAudioDataType | grep -A 5 MusicianStream
```

**Expected output:**
```
MusicianStream:
    Default Sample Rate: 48000
    Transport: Virtual
```

Alternatively, open **System Settings → Sound → Input** and verify "MusicianStream" appears in the input device list.

### 5. Install the App

Copy the app to Applications:

```bash
cp -r App/build/Release/MusicianStream.app /Applications/
```

### 6. Launch the App

```bash
open /Applications/MusicianStream.app
```

Or launch from Spotlight (⌘ Space, type "MusicianStream") or Applications folder in Finder.

### 7. Grant Permissions (if prompted)

macOS may show a security warning for unsigned applications. To allow:

1. Open **System Settings → Privacy & Security**
2. Scroll down to the Security section
3. Click **"Open Anyway"** next to the MusicianStream warning

**Note:** Personal use builds don't require code signing. For distribution, proper signing is needed.

## Verification

### Check Driver Status

Open **Console.app** and filter for "MusicianStream":

1. Open Console.app
2. In the search bar, enter: `subsystem:com.musicianstream.driver`
3. Or use Action → Include Info Messages

You should see initialization logs like:
```
MusicianStream plugin created
Latched to device: Rubix 44 (4 channels, 48000 Hz)
MusicianStream plugin initialized
XPC service started
```

### Check App Status

1. **Menu bar icon should appear** - Look for a waveform icon in the menu bar (usually on the right side)
2. **Click the icon** - A popover menu should open
3. **Verify device name** - Shows your latched device (e.g., "Rubix 44" or whatever your system default input is)
4. **Check activity indicator** - Copper dot should be lit if driver is active

### Test in Video Call App

1. Open **Zoom**, **Discord**, or another video call application
2. Go to **Audio Settings**
3. Select **"MusicianStream"** as input device
4. Start a test call or audio check
5. Speak into mic and/or play piano keys

**Expected:** Audio should be transmitted (note: current implementation may output silence - see Known Limitations in README.md)

## Configuration

### Set MusicianStream as Default Input (Optional)

To use MusicianStream system-wide:

1. Open **System Settings → Sound**
2. Go to the **Input** tab
3. Select **"MusicianStream"** from the list

**Note:** Most video call apps let you select input independently, so setting as system default is optional.

### Launch at Login (Optional)

To have the menu bar app launch automatically:

1. Open **System Settings → General → Login Items**
2. Click **+** (Add)
3. Navigate to `/Applications/MusicianStream.app`
4. Click **Add**

The app will now start automatically when you log in.

## Uninstallation

### 1. Quit the App

Click the menu bar icon → **Quit**

Or use Activity Monitor to force quit if unresponsive.

### 2. Remove the App

```bash
rm -rf /Applications/MusicianStream.app
```

### 3. Remove the Driver

```bash
sudo rm -rf /Library/Audio/Plug-Ins/HAL/MusicianStream.driver
```

**Important:** Use `sudo` to remove the driver (requires administrator privileges).

### 4. Restart Core Audio

```bash
sudo killall coreaudiod
```

This unloads the driver from the audio system.

### 5. Clean Up Settings (Optional)

Remove saved preferences:

```bash
defaults delete com.musicianstream.app
```

This removes mode and limiter threshold settings. Skip this if you plan to reinstall later.

## Troubleshooting

### Driver Not Appearing in Sound Settings

**Problem:** MusicianStream doesn't appear in the input device list

**Solutions:**
1. **Restart coreaudiod:**
   ```bash
   sudo killall coreaudiod
   ```
2. **Verify driver is installed:**
   ```bash
   ls -la /Library/Audio/Plug-Ins/HAL/MusicianStream.driver
   ```
   Should show the bundle with correct permissions.

3. **Check Console.app for errors:**
   - Open Console.app
   - Filter for "coreaudiod" process
   - Look for loading errors or crashes

4. **Verify macOS version:**
   ```bash
   sw_vers
   ```
   ProductVersion should be 14.0 or higher.

5. **Check bundle structure:**
   ```bash
   ls -R /Library/Audio/Plug-Ins/HAL/MusicianStream.driver
   ```
   Should contain `Contents/MacOS/MusicianStream` binary.

### App Shows "Driver Not Loaded"

**Problem:** Menu bar app can't connect to the driver via XPC

**Solutions:**
1. **Verify driver is installed** (see above)
2. **Restart coreaudiod:**
   ```bash
   sudo killall coreaudiod
   ```
3. **Restart the app** - Quit completely and relaunch
4. **Check XPC connection logs:**
   ```bash
   log show --predicate 'subsystem == "com.musicianstream.app"' --last 5m
   ```
   Look for XPC connection errors

### App Won't Launch

**Problem:** Double-clicking app does nothing or shows error

**Solutions:**
1. **Check macOS version:**
   ```bash
   sw_vers
   ```
   Requires macOS 14.0 (Sonoma) or later.

2. **Check app location:**
   ```bash
   ls -la /Applications/MusicianStream.app
   ```
   App must be in `/Applications/` for proper permissions.

3. **Grant security permissions:**
   - Open System Settings → Privacy & Security
   - Click "Open Anyway" for MusicianStream

4. **Check launch logs:**
   ```bash
   log show --predicate 'subsystem == "com.apple.LaunchServices"' --last 1m
   ```
   Launch failures are logged here.

5. **Try launching from Terminal:**
   ```bash
   /Applications/MusicianStream.app/Contents/MacOS/MusicianStream
   ```
   May reveal specific error messages.

### No Audio in Video Calls

**Problem:** Video call app receives silence or no audio

**Solutions:**
1. **Verify physical device has audio:**
   - Speak into mic
   - Play piano keys
   - Check input level in System Settings → Sound → Input

2. **Check cables:**
   - Piano connected to channels 1-2 (stereo)
   - Mic connected to channel 3 (mono)

3. **Verify device latching:**
   - Open MusicianStream menu bar popover
   - Check device name matches your audio interface
   - Should show correct channel count

4. **Check Console for errors:**
   ```bash
   log show --predicate 'subsystem == "com.musicianstream.driver"' --last 5m
   ```
   Look for buffer underrun warnings or IO errors.

5. **Known Limitation:**
   Current implementation outputs silence from `DoIOOperation`. Full audio routing requires macOS-specific IOProc implementation (see README.md).

### Menu Bar Icon Not Showing

**Problem:** App launches but no icon appears in menu bar

**Solutions:**
1. **Check if app is running:**
   ```bash
   ps aux | grep MusicianStream
   ```
   Should show process running.

2. **Check LSUIElement setting:**
   ```bash
   plutil -p /Applications/MusicianStream.app/Contents/Info.plist | grep LSUIElement
   ```
   Should show `"LSUIElement" => 1`

3. **Restart menu bar:**
   ```bash
   killall SystemUIServer
   ```

4. **Check right side of menu bar:**
   Icon may be hidden if menu bar is crowded - click the `>>` overflow menu.

5. **Generate icon assets:**
   See `App/Resources/Assets.xcassets/README.md` - PNG files need to be generated from SVG templates.

### Device Disconnected Error

**Problem:** Driver loses connection to physical device

**Solutions:**
1. **Check physical device:**
   - USB cable connected
   - Device powered on
   - Shows in System Settings → Sound

2. **Restart driver:**
   ```bash
   sudo killall coreaudiod
   ```

3. **Change system default:**
   If you changed the default input device, MusicianStream latches to whatever was default at startup. Restart coreaudiod to re-latch.

## Advanced Configuration

### Debug Logging

Enable verbose driver logging:

```bash
log config --mode "level:debug" --subsystem com.musicianstream.driver
```

View logs in real-time:

```bash
log stream --predicate 'subsystem == "com.musicianstream.driver"'
```

Reset to default logging:

```bash
log config --mode "level:default" --subsystem com.musicianstream.driver
```

### Custom Installation Location (Not Recommended)

The driver **must** be in `/Library/Audio/Plug-Ins/HAL/` for CoreAudio to detect it. User-level installation (`~/Library/`) is not supported for HAL plugins.

### Multiple Audio Interfaces

MusicianStream latches to the system **default** input at coreaudiod startup. To use a specific interface:

1. Set that interface as system default in Sound Settings
2. Restart coreaudiod: `sudo killall coreaudiod`
3. Launch MusicianStream app

The driver will latch to whichever interface was default at initialization.

## Getting Help

### Check System Logs

Complete diagnostic log collection:

```bash
# Collect last 5 minutes of all relevant logs
log show --predicate 'subsystem CONTAINS "musicianstream"' --last 5m > ~/Desktop/musicianstream-logs.txt

# Include coreaudiod logs
log show --predicate 'process == "coreaudiod"' --last 5m >> ~/Desktop/musicianstream-logs.txt

# System profiler audio info
system_profiler SPAudioDataType >> ~/Desktop/musicianstream-logs.txt
```

### Report Issues

When reporting issues, include:
1. macOS version: `sw_vers`
2. Log file from above
3. Steps to reproduce
4. Expected vs actual behavior

## Next Steps

After successful installation:
1. Review [README.md](../README.md) for usage instructions
2. Run integration tests: [testing/integration-test-plan.md](testing/integration-test-plan.md)
3. Configure your video call software to use MusicianStream
4. Adjust mode (Stereo/Mono) and limiter threshold to your preference

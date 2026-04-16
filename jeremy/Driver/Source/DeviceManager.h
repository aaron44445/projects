#ifndef DeviceManager_h
#define DeviceManager_h

#include "Types.h"
#include <CoreAudio/CoreAudio.h>

namespace MusicianStream {

class DeviceManager {
public:
    DeviceManager();
    ~DeviceManager();

    // Query system default input device
    bool findSystemDefaultInput();

    // Get device properties
    AudioObjectID getDeviceID() const { return mDeviceID; }
    CFStringRef getDeviceName() const { return mDeviceName; }
    const AudioStreamBasicDescription& getFormat() const { return mFormat; }
    uint32_t getChannelCount() const { return mChannelCount; }

    // Read audio from physical device
    OSStatus readAudio(AudioBufferList* bufferList, uint32_t frameCount);

private:
    AudioObjectID mDeviceID;
    CFStringRef mDeviceName;
    AudioStreamBasicDescription mFormat;
    uint32_t mChannelCount;
    AudioDeviceIOProcID mIOProcID;

    static OSStatus IOProc(AudioObjectID inDevice,
                           const AudioTimeStamp* inNow,
                           const AudioBufferList* inInputData,
                           const AudioTimeStamp* inInputTime,
                           AudioBufferList* outOutputData,
                           const AudioTimeStamp* inOutputTime,
                           void* inClientData);
};

} // namespace MusicianStream

#endif /* DeviceManager_h */

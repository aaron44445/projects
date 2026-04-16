#ifndef Types_h
#define Types_h

#include <CoreAudio/AudioServerPlugIn.h>
#include <CoreFoundation/CoreFoundation.h>
#include <atomic>

namespace MusicianStream {

// Audio processing mode
enum class AudioMode {
    Stereo,
    Mono
};

// Driver state
struct DriverState {
    std::atomic<AudioMode> mode{AudioMode::Stereo};
    std::atomic<float> limiterThreshold{-1.0f};
    AudioObjectID physicalDeviceID{kAudioObjectUnknown};
    CFStringRef physicalDeviceName{nullptr};
    AudioStreamBasicDescription deviceFormat{};
    uint32_t physicalChannelCount{0};
    bool isActive{false};
};

// Constants
constexpr uint32_t kVirtualDeviceChannelCount = 2; // Stereo output
constexpr uint32_t kExpectedPhysicalChannels = 3;  // Piano L+R + Mic
constexpr uint32_t kLimiterLookaheadMs = 5;
constexpr float kLimiterAttackMs = 0.5f;
constexpr float kLimiterReleaseMs = 50.0f;
constexpr const char* kVirtualDeviceName = "MusicianStream";
constexpr const char* kVirtualDeviceManufacturer = "MusicianStream";
constexpr uint32_t kVirtualDeviceUID = 'MsIC';

} // namespace MusicianStream

#endif /* Types_h */

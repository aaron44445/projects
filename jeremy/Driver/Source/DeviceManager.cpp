#include "DeviceManager.h"
#include <os/log.h>

namespace MusicianStream {

DeviceManager::DeviceManager()
    : mDeviceID(kAudioObjectUnknown)
    , mDeviceName(nullptr)
    , mChannelCount(0)
    , mIOProcID(nullptr)
{
    std::memset(&mFormat, 0, sizeof(mFormat));
}

DeviceManager::~DeviceManager() {
    if (mDeviceName) {
        CFRelease(mDeviceName);
    }

    if (mIOProcID && mDeviceID != kAudioObjectUnknown) {
        AudioDeviceDestroyIOProcID(mDeviceID, mIOProcID);
    }
}

bool DeviceManager::findSystemDefaultInput() {
    // Query for system default input device
    AudioObjectPropertyAddress propertyAddress = {
        kAudioHardwarePropertyDefaultInputDevice,
        kAudioObjectPropertyScopeGlobal,
        kAudioObjectPropertyElementMain
    };

    UInt32 deviceIDSize = sizeof(AudioObjectID);
    OSStatus status = AudioObjectGetPropertyData(
        kAudioObjectSystemObject,
        &propertyAddress,
        0,
        nullptr,
        &deviceIDSize,
        &mDeviceID
    );

    if (status != noErr || mDeviceID == kAudioObjectUnknown) {
        os_log_error(OS_LOG_DEFAULT, "Failed to get default input device: %d", status);
        return false;
    }

    // Get device name
    propertyAddress.mSelector = kAudioObjectPropertyName;
    propertyAddress.mScope = kAudioObjectPropertyScopeGlobal;

    UInt32 nameSize = sizeof(CFStringRef);
    status = AudioObjectGetPropertyData(
        mDeviceID,
        &propertyAddress,
        0,
        nullptr,
        &nameSize,
        &mDeviceName
    );

    if (status != noErr) {
        os_log_error(OS_LOG_DEFAULT, "Failed to get device name: %d", status);
        mDeviceName = CFSTR("Unknown Device");
        CFRetain(mDeviceName);
    }

    // Get stream format
    propertyAddress.mSelector = kAudioDevicePropertyStreamFormat;
    propertyAddress.mScope = kAudioDevicePropertyScopeInput;

    UInt32 formatSize = sizeof(AudioStreamBasicDescription);
    status = AudioObjectGetPropertyData(
        mDeviceID,
        &propertyAddress,
        0,
        nullptr,
        &formatSize,
        &mFormat
    );

    if (status != noErr) {
        os_log_error(OS_LOG_DEFAULT, "Failed to get device format: %d", status);
        // Fallback to 48kHz/32-bit float
        mFormat.mSampleRate = 48000.0;
        mFormat.mFormatID = kAudioFormatLinearPCM;
        mFormat.mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;
        mFormat.mBytesPerPacket = 4;
        mFormat.mFramesPerPacket = 1;
        mFormat.mBytesPerFrame = 4;
        mFormat.mChannelsPerFrame = 2;
        mFormat.mBitsPerChannel = 32;
    }

    // Get channel count
    propertyAddress.mSelector = kAudioDevicePropertyStreamConfiguration;
    propertyAddress.mScope = kAudioDevicePropertyScopeInput;

    UInt32 configSize = 0;
    status = AudioObjectGetPropertyDataSize(
        mDeviceID,
        &propertyAddress,
        0,
        nullptr,
        &configSize
    );

    if (status == noErr && configSize > 0) {
        AudioBufferList* config = (AudioBufferList*)malloc(configSize);
        status = AudioObjectGetPropertyData(
            mDeviceID,
            &propertyAddress,
            0,
            nullptr,
            &configSize,
            config
        );

        if (status == noErr) {
            mChannelCount = 0;
            for (UInt32 i = 0; i < config->mNumberBuffers; i++) {
                mChannelCount += config->mBuffers[i].mNumberChannels;
            }
        }
        free(config);
    }

    if (mChannelCount == 0) {
        mChannelCount = mFormat.mChannelsPerFrame;
    }

    char deviceNameCString[256];
    CFStringGetCString(mDeviceName, deviceNameCString, sizeof(deviceNameCString), kCFStringEncodingUTF8);
    os_log_info(OS_LOG_DEFAULT, "Latched to device: %s (%u channels, %.0f Hz)",
                deviceNameCString, mChannelCount, mFormat.mSampleRate);

    return true;
}

OSStatus DeviceManager::IOProc(AudioObjectID inDevice,
                                const AudioTimeStamp* inNow,
                                const AudioBufferList* inInputData,
                                const AudioTimeStamp* inInputTime,
                                AudioBufferList* outOutputData,
                                const AudioTimeStamp* inOutputTime,
                                void* inClientData)
{
    // This is called by CoreAudio when physical device has data
    // For now, we'll use polling instead of this callback
    return noErr;
}

OSStatus DeviceManager::readAudio(AudioBufferList* bufferList, uint32_t frameCount) {
    // Note: In a real implementation, this would read from the physical device's IOProc
    // For this driver, we'll rely on the HAL's own input reading mechanism
    // This is a simplified version - actual implementation would use AudioDeviceRead or IOProc callbacks

    // For now, fill with zeros (silence)
    for (UInt32 i = 0; i < bufferList->mNumberBuffers; i++) {
        std::memset(bufferList->mBuffers[i].mData, 0,
                   bufferList->mBuffers[i].mDataByteSize);
    }

    return noErr;
}

} // namespace MusicianStream

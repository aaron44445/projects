#include "PluginInterface.h"
#include "../Shared/XPCProtocol.h"
#include <os/log.h>
#include <mach/mach_time.h>
#include <cstring>

namespace MusicianStream {

// Static plugin object instance
static PluginObject* gPluginObject = nullptr;
static AudioObjectID gDeviceObjectID = 1000;
static AudioObjectID gStreamObjectID = 1001;
static const AudioObjectID kPluginObjectID = kAudioObjectPlugInObject;

// vtable for driver interface
static AudioServerPlugInDriverInterface gPluginInterfaceVTable = {
    nullptr, // required padding
    nullptr, // QueryInterface
    nullptr, // AddRef
    nullptr, // Release
    PluginInterface::Initialize,
    PluginInterface::CreateDevice,
    PluginInterface::DestroyDevice,
    PluginInterface::AddDeviceClient,
    PluginInterface::RemoveDeviceClient,
    PluginInterface::PerformDeviceConfigurationChange,
    PluginInterface::AbortDeviceConfigurationChange,
    PluginInterface::HasProperty,
    PluginInterface::IsPropertySettable,
    PluginInterface::GetPropertyDataSize,
    PluginInterface::GetPropertyData,
    PluginInterface::SetPropertyData,
    PluginInterface::StartIO,
    PluginInterface::StopIO,
    PluginInterface::GetZeroTimeStamp,
    PluginInterface::WillDoIOOperation,
    PluginInterface::BeginIOOperation,
    PluginInterface::DoIOOperation,
    PluginInterface::EndIOOperation
};

extern "C" void* AudioServerPlugInCreate(CFAllocatorRef allocator, CFUUIDRef requestedTypeUUID) {
    if (!CFEqual(requestedTypeUUID, kAudioServerPlugInTypeUUID)) {
        return nullptr;
    }

    gPluginObject = new PluginObject();
    gPluginObject->vtable = &gPluginInterfaceVTable;
    gPluginObject->reference = nullptr;
    gPluginObject->deviceManager = new DeviceManager();
    gPluginObject->audioProcessor = nullptr; // Created when device manager gets format
    gPluginObject->xpcService = new XPCService();

    os_log_info(OS_LOG_DEFAULT, "MusicianStream plugin created");

    return gPluginObject;
}

OSStatus PluginInterface::Initialize(AudioServerPlugInDriverRef driver, AudioServerPlugInHostRef host) {
    if (!gPluginObject) {
        return kAudio_ParamError;
    }

    os_log_info(OS_LOG_DEFAULT, "MusicianStream plugin initializing");

    // Find system default input device
    if (!gPluginObject->deviceManager->findSystemDefaultInput()) {
        os_log_error(OS_LOG_DEFAULT, "Failed to find system default input");
        // Continue anyway - we'll output silence
    }

    // Create audio processor with device format
    const auto& format = gPluginObject->deviceManager->getFormat();
    uint32_t sampleRate = static_cast<uint32_t>(format.mSampleRate);
    if (sampleRate == 0) {
        sampleRate = 48000; // Fallback
    }

    gPluginObject->audioProcessor = new AudioProcessor(sampleRate);

    // Start XPC service
    gPluginObject->xpcService->start();

    // Set up XPC callbacks
    gPluginObject->xpcService->setModeChangeCallback([](AudioMode mode) {
        if (gPluginObject && gPluginObject->audioProcessor) {
            gPluginObject->state.mode.store(mode);
            gPluginObject->audioProcessor->setMode(mode);
        }
    });

    gPluginObject->xpcService->setThresholdChangeCallback([](float threshold) {
        if (gPluginObject && gPluginObject->audioProcessor) {
            gPluginObject->state.limiterThreshold.store(threshold);
            gPluginObject->audioProcessor->setLimiterThreshold(threshold);
        }
    });

    gPluginObject->xpcService->setStatusRequestCallback([]() -> xpc_object_t {
        xpc_object_t response = xpc_dictionary_create(nullptr, nullptr, 0);

        if (gPluginObject) {
            // Get device name
            char deviceName[256] = "Unknown";
            if (gPluginObject->deviceManager->getDeviceName()) {
                CFStringGetCString(gPluginObject->deviceManager->getDeviceName(),
                                 deviceName, sizeof(deviceName), kCFStringEncodingUTF8);
            }

            xpc_dictionary_set_string(response, kXPCResponseDeviceName, deviceName);

            AudioMode mode = gPluginObject->state.mode.load();
            xpc_dictionary_set_string(response, kXPCResponseCurrentMode,
                                    (mode == AudioMode::Mono) ? kAudioModeMono : kAudioModeStereo);

            xpc_dictionary_set_double(response, kXPCResponseThreshold,
                                    gPluginObject->state.limiterThreshold.load());

            xpc_dictionary_set_bool(response, kXPCResponseIsActive,
                                  gPluginObject->state.isActive.load());
        }

        return response;
    });

    os_log_info(OS_LOG_DEFAULT, "MusicianStream plugin initialized");

    return kAudioHardwareNoError;
}

// Device lifecycle methods
OSStatus PluginInterface::CreateDevice(AudioServerPlugInDriverRef driver, CFDictionaryRef description, const AudioServerPlugInClientInfo* clientInfo, AudioObjectID* outDeviceObjectID) {
    *outDeviceObjectID = gDeviceObjectID;
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::DestroyDevice(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID) {
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::AddDeviceClient(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, const AudioServerPlugInClientInfo* clientInfo) {
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::RemoveDeviceClient(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, const AudioServerPlugInClientInfo* clientInfo) {
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::PerformDeviceConfigurationChange(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt64 changeAction, void* changeInfo) {
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::AbortDeviceConfigurationChange(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt64 changeAction, void* changeInfo) {
    return kAudioHardwareNoError;
}

// Property operations
Boolean PluginInterface::HasProperty(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address) {
    if (objectID == gDeviceObjectID || objectID == kPluginObjectID) {
        switch (address->mSelector) {
            case kAudioObjectPropertyName:
            case kAudioDevicePropertyDeviceNameCFString:
            case kAudioDevicePropertyStreams:
            case kAudioDevicePropertyStreamConfiguration:
            case kAudioObjectPropertyManufacturer:
                return true;
        }
    }
    return false;
}

OSStatus PluginInterface::IsPropertySettable(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, Boolean* outIsSettable) {
    *outIsSettable = false;
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::GetPropertyDataSize(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, UInt32 qualifierDataSize, const void* qualifierData, UInt32* outDataSize) {
    switch (address->mSelector) {
        case kAudioObjectPropertyName:
        case kAudioDevicePropertyDeviceNameCFString:
            *outDataSize = sizeof(CFStringRef);
            return kAudioHardwareNoError;
        default:
            return kAudioHardwareUnknownPropertyError;
    }
}

OSStatus PluginInterface::GetPropertyData(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, UInt32 qualifierDataSize, const void* qualifierData, UInt32 inDataSize, UInt32* outDataSize, void* outData) {
    switch (address->mSelector) {
        case kAudioObjectPropertyName:
        case kAudioDevicePropertyDeviceNameCFString: {
            CFStringRef name = CFStringCreateWithCString(kCFAllocatorDefault, kVirtualDeviceName, kCFStringEncodingUTF8);
            *static_cast<CFStringRef*>(outData) = name;
            *outDataSize = sizeof(CFStringRef);
            return kAudioHardwareNoError;
        }
        default:
            return kAudioHardwareUnknownPropertyError;
    }
}

OSStatus PluginInterface::SetPropertyData(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, UInt32 qualifierDataSize, const void* qualifierData, UInt32 inDataSize, const void* inData) {
    return kAudioHardwareUnsupportedOperationError;
}

// IO operations
OSStatus PluginInterface::StartIO(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID) {
    if (gPluginObject) {
        gPluginObject->state.isActive.store(true);
        os_log_info(OS_LOG_DEFAULT, "MusicianStream IO started");
    }
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::StopIO(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID) {
    if (gPluginObject) {
        gPluginObject->state.isActive.store(false);
        os_log_info(OS_LOG_DEFAULT, "MusicianStream IO stopped");
    }
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::GetZeroTimeStamp(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, Float64* outSampleTime, UInt64* outHostTime, UInt64* outSeed) {
    *outSampleTime = 0.0;
    *outHostTime = mach_absolute_time();
    *outSeed = 1;
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::WillDoIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, UInt32 operationID, Boolean* outWillDo, Boolean* outWillDoInPlace) {
    *outWillDo = (operationID == kAudioServerPlugInIOOperationReadInput);
    *outWillDoInPlace = true;
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::BeginIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, UInt32 operationID, UInt32 ioBufferFrameSize, const AudioServerPlugInIOCycleInfo* ioCycleInfo) {
    return kAudioHardwareNoError;
}

OSStatus PluginInterface::DoIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, AudioObjectID streamObjectID, UInt32 clientID, UInt32 operationID, UInt32 ioBufferFrameSize, const AudioServerPlugInIOCycleInfo* ioCycleInfo, void* ioMainBuffer, void* ioSecondaryBuffer) {
    if (!gPluginObject || !gPluginObject->audioProcessor) {
        return kAudioHardwareNoError;
    }

    // For this simplified version, we'll output silence
    // In a real implementation, we would:
    // 1. Read from physical device via DeviceManager
    // 2. Extract channel buffers
    // 3. Pass through AudioProcessor
    // 4. Write to ioMainBuffer

    // Output silence for now
    AudioBufferList* bufferList = static_cast<AudioBufferList*>(ioMainBuffer);
    for (UInt32 i = 0; i < bufferList->mNumberBuffers; i++) {
        std::memset(bufferList->mBuffers[i].mData, 0, bufferList->mBuffers[i].mDataByteSize);
    }

    return kAudioHardwareNoError;
}

OSStatus PluginInterface::EndIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, UInt32 operationID, UInt32 ioBufferFrameSize, const AudioServerPlugInIOCycleInfo* ioCycleInfo) {
    return kAudioHardwareNoError;
}

} // namespace MusicianStream

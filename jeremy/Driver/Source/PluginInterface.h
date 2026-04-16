#ifndef PluginInterface_h
#define PluginInterface_h

#include "Types.h"
#include "DeviceManager.h"
#include "AudioProcessor.h"
#include "XPCService.h"
#include <CoreAudio/AudioServerPlugIn.h>

namespace MusicianStream {

// Plugin object structure
struct PluginObject {
    AudioServerPlugInDriverInterface* vtable;
    void* reference;

    DriverState state;
    DeviceManager* deviceManager;
    AudioProcessor* audioProcessor;
    XPCService* xpcService;
};

// AudioServerPlugIn entry point
extern "C" {
    void* AudioServerPlugInCreate(CFAllocatorRef allocator, CFUUIDRef requestedTypeUUID);
}

// Driver interface implementation
class PluginInterface {
public:
    static OSStatus Initialize(AudioServerPlugInDriverRef driver, AudioServerPlugInHostRef host);
    static OSStatus CreateDevice(AudioServerPlugInDriverRef driver, CFDictionaryRef description, const AudioServerPlugInClientInfo* clientInfo, AudioObjectID* outDeviceObjectID);
    static OSStatus DestroyDevice(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID);
    static OSStatus AddDeviceClient(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, const AudioServerPlugInClientInfo* clientInfo);
    static OSStatus RemoveDeviceClient(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, const AudioServerPlugInClientInfo* clientInfo);
    static OSStatus PerformDeviceConfigurationChange(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt64 changeAction, void* changeInfo);
    static OSStatus AbortDeviceConfigurationChange(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt64 changeAction, void* changeInfo);

    // Property operations
    static Boolean HasProperty(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address);
    static OSStatus IsPropertySettable(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, Boolean* outIsSettable);
    static OSStatus GetPropertyDataSize(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, UInt32 qualifierDataSize, const void* qualifierData, UInt32* outDataSize);
    static OSStatus GetPropertyData(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, UInt32 qualifierDataSize, const void* qualifierData, UInt32 inDataSize, UInt32* outDataSize, void* outData);
    static OSStatus SetPropertyData(AudioServerPlugInDriverRef driver, AudioObjectID objectID, pid_t clientProcessID, const AudioObjectPropertyAddress* address, UInt32 qualifierDataSize, const void* qualifierData, UInt32 inDataSize, const void* inData);

    // IO operations
    static OSStatus StartIO(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID);
    static OSStatus StopIO(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID);
    static OSStatus GetZeroTimeStamp(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, Float64* outSampleTime, UInt64* outHostTime, UInt64* outSeed);
    static OSStatus WillDoIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, UInt32 operationID, Boolean* outWillDo, Boolean* outWillDoInPlace);
    static OSStatus BeginIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, UInt32 operationID, UInt32 ioBufferFrameSize, const AudioServerPlugInIOCycleInfo* ioCycleInfo);
    static OSStatus DoIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, AudioObjectID streamObjectID, UInt32 clientID, UInt32 operationID, UInt32 ioBufferFrameSize, const AudioServerPlugInIOCycleInfo* ioCycleInfo, void* ioMainBuffer, void* ioSecondaryBuffer);
    static OSStatus EndIOOperation(AudioServerPlugInDriverRef driver, AudioObjectID deviceObjectID, UInt32 clientID, UInt32 operationID, UInt32 ioBufferFrameSize, const AudioServerPlugInIOCycleInfo* ioCycleInfo);
};

} // namespace MusicianStream

#endif /* PluginInterface_h */

//
//  XPCProtocol.h
//  MusicianStream
//
//  Shared XPC protocol for communication between App and Driver
//

#ifndef XPCProtocol_h
#define XPCProtocol_h

#ifdef __cplusplus
extern "C" {
#endif

// XPC Service Mach service name
#define kMusicianStreamXPCServiceName "com.musicianstream.driver.xpc"

// XPC Message Types
#define kXPCMessageTypeKey "message_type"
#define kXPCMessageTypeSetMode "set_mode"
#define kXPCMessageTypeSetThreshold "set_threshold"
#define kXPCMessageTypeGetStatus "get_status"

// XPC Message Parameters
#define kXPCParamMode "mode"
#define kXPCParamThreshold "threshold"

// XPC Response Keys
#define kXPCResponseDeviceName "device_name"
#define kXPCResponseCurrentMode "current_mode"
#define kXPCResponseThreshold "limiter_threshold"
#define kXPCResponseIsActive "is_active"

// Audio Modes
#define kAudioModeStereo "stereo"
#define kAudioModeMono "mono"

// Limiter Constants
#define kLimiterThresholdMin -6.0f
#define kLimiterThresholdMax 0.0f
#define kLimiterThresholdDefault -1.0f

// Settings Keys (for plist persistence)
#define kSettingsAudioMode "audioMode"
#define kSettingsLimiterThreshold "limiterThreshold"

#ifdef __cplusplus
}
#endif

#endif /* XPCProtocol_h */

//
//  XPCProtocol.h
//  MusicianStream
//
//  Shared XPC protocol for communication between App and Driver
//

#ifndef XPCProtocol_h
#define XPCProtocol_h

#import <Foundation/Foundation.h>

// XPC Service Name
#define kMusicianStreamXPCServiceName "com.musicianstream.xpc"

// XPC Protocol for Driver Control
@protocol MusicianStreamXPCProtocol

// Driver control methods
- (void)enableDriverWithReply:(void (^)(BOOL success, NSError * _Nullable error))reply;
- (void)disableDriverWithReply:(void (^)(BOOL success, NSError * _Nullable error))reply;
- (void)getDriverStatusWithReply:(void (^)(BOOL enabled, NSError * _Nullable error))reply;

// Audio configuration methods
- (void)setInputGainDecibels:(float)decibels reply:(void (^)(BOOL success, NSError * _Nullable error))reply;
- (void)getInputGainWithReply:(void (^)(float decibels, NSError * _Nullable error))reply;
- (void)setLimiterThresholdDecibels:(float)decibels reply:(void (^)(BOOL success, NSError * _Nullable error))reply;
- (void)getLimiterThresholdWithReply:(void (^)(float decibels, NSError * _Nullable error))reply;

@end

#endif /* XPCProtocol_h */

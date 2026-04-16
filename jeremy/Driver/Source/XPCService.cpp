#include "XPCService.h"
#include "../Shared/XPCProtocol.h"
#include <os/log.h>
#include <algorithm>

namespace MusicianStream {

XPCService::XPCService()
    : mListener(nullptr)
{
}

XPCService::~XPCService() {
    stop();
}

bool XPCService::start() {
    if (mListener) {
        return true; // Already started
    }

    // Create XPC listener
    mListener = xpc_connection_create_mach_service(
        kMusicianStreamXPCServiceName,
        dispatch_get_main_queue(),
        XPC_CONNECTION_MACH_SERVICE_LISTENER
    );

    if (!mListener) {
        os_log_error(OS_LOG_DEFAULT, "Failed to create XPC listener");
        return false;
    }

    // Set up connection handler
    xpc_connection_set_event_handler(mListener, ^(xpc_object_t event) {
        xpc_type_t type = xpc_get_type(event);
        if (type == XPC_TYPE_CONNECTION) {
            handleConnection((xpc_connection_t)event);
        } else if (type == XPC_TYPE_ERROR) {
            if (event == XPC_ERROR_CONNECTION_INVALID) {
                os_log_error(OS_LOG_DEFAULT, "XPC connection invalid");
            } else if (event == XPC_ERROR_TERMINATION_IMMINENT) {
                os_log_info(OS_LOG_DEFAULT, "XPC termination imminent");
            }
        }
    });

    xpc_connection_resume(mListener);
    os_log_info(OS_LOG_DEFAULT, "XPC service started");

    return true;
}

void XPCService::stop() {
    if (mListener) {
        xpc_connection_cancel(mListener);
        xpc_release(mListener);
        mListener = nullptr;
        os_log_info(OS_LOG_DEFAULT, "XPC service stopped");
    }
}

void XPCService::setModeChangeCallback(ModeChangeCallback callback) {
    std::lock_guard<std::mutex> lock(mCallbackMutex);
    mModeCallback = callback;
}

void XPCService::setThresholdChangeCallback(ThresholdChangeCallback callback) {
    std::lock_guard<std::mutex> lock(mCallbackMutex);
    mThresholdCallback = callback;
}

void XPCService::setStatusRequestCallback(StatusRequestCallback callback) {
    std::lock_guard<std::mutex> lock(mCallbackMutex);
    mStatusCallback = callback;
}

void XPCService::handleConnection(xpc_connection_t peer) {
    xpc_connection_set_event_handler(peer, ^(xpc_object_t event) {
        xpc_type_t type = xpc_get_type(event);
        if (type == XPC_TYPE_DICTIONARY) {
            handleMessage(event, peer);
        } else if (type == XPC_TYPE_ERROR) {
            os_log_error(OS_LOG_DEFAULT, "XPC peer error");
        }
    });

    xpc_connection_resume(peer);
    os_log_info(OS_LOG_DEFAULT, "XPC peer connected");
}

void XPCService::handleMessage(xpc_object_t message, xpc_connection_t peer) {
    const char* messageType = xpc_dictionary_get_string(message, kXPCMessageTypeKey);
    if (!messageType) {
        os_log_error(OS_LOG_DEFAULT, "XPC message missing type");
        sendErrorResponse(peer, "Message missing type field");
        return;
    }

    if (strcmp(messageType, kXPCMessageTypeSetMode) == 0) {
        const char* modeStr = xpc_dictionary_get_string(message, kXPCParamMode);
        if (modeStr) {
            std::lock_guard<std::mutex> lock(mCallbackMutex);
            if (mModeCallback) {
                AudioMode mode = (strcmp(modeStr, kAudioModeMono) == 0)
                               ? AudioMode::Mono
                               : AudioMode::Stereo;
                mModeCallback(mode);
                os_log_info(OS_LOG_DEFAULT, "XPC: Set mode to %s", modeStr);
            }
        }
    }
    else if (strcmp(messageType, kXPCMessageTypeSetThreshold) == 0) {
        double threshold = xpc_dictionary_get_double(message, kXPCParamThreshold);

        // Validate and clamp threshold to valid range
        if (threshold < kLimiterThresholdMin || threshold > kLimiterThresholdMax) {
            os_log_error(OS_LOG_DEFAULT, "XPC: Threshold %.1f dB out of range [%.1f, %.1f], clamping",
                        threshold, kLimiterThresholdMin, kLimiterThresholdMax);
            threshold = std::clamp(threshold,
                                  static_cast<double>(kLimiterThresholdMin),
                                  static_cast<double>(kLimiterThresholdMax));
        }

        std::lock_guard<std::mutex> lock(mCallbackMutex);
        if (mThresholdCallback) {
            mThresholdCallback(static_cast<float>(threshold));
            os_log_info(OS_LOG_DEFAULT, "XPC: Set threshold to %.1f dB", threshold);
        }
    }
    else if (strcmp(messageType, kXPCMessageTypeGetStatus) == 0) {
        std::lock_guard<std::mutex> lock(mCallbackMutex);
        if (mStatusCallback) {
            xpc_object_t response = mStatusCallback();
            if (response) {
                xpc_connection_send_message(peer, response);
                xpc_release(response);
            } else {
                os_log_error(OS_LOG_DEFAULT, "XPC: Status callback returned null response");
                sendErrorResponse(peer, "Failed to retrieve status");
            }
        } else {
            sendErrorResponse(peer, "Status callback not registered");
        }
    }
}

void XPCService::sendErrorResponse(xpc_connection_t peer, const char* errorMessage) {
    xpc_object_t response = xpc_dictionary_create(nullptr, nullptr, 0);
    xpc_dictionary_set_string(response, "error", errorMessage);
    xpc_connection_send_message(peer, response);
    xpc_release(response);
}

} // namespace MusicianStream

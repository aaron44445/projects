#include "XPCService.h"
#include "../Shared/XPCProtocol.h"
#include <os/log.h>

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
    mModeCallback = callback;
}

void XPCService::setThresholdChangeCallback(ThresholdChangeCallback callback) {
    mThresholdCallback = callback;
}

void XPCService::setStatusRequestCallback(StatusRequestCallback callback) {
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
        return;
    }

    if (strcmp(messageType, kXPCMessageTypeSetMode) == 0) {
        const char* modeStr = xpc_dictionary_get_string(message, kXPCParamMode);
        if (modeStr && mModeCallback) {
            AudioMode mode = (strcmp(modeStr, kAudioModeMono) == 0)
                           ? AudioMode::Mono
                           : AudioMode::Stereo;
            mModeCallback(mode);
            os_log_info(OS_LOG_DEFAULT, "XPC: Set mode to %s", modeStr);
        }
    }
    else if (strcmp(messageType, kXPCMessageTypeSetThreshold) == 0) {
        double threshold = xpc_dictionary_get_double(message, kXPCParamThreshold);
        if (mThresholdCallback) {
            mThresholdCallback(static_cast<float>(threshold));
            os_log_info(OS_LOG_DEFAULT, "XPC: Set threshold to %.1f dB", threshold);
        }
    }
    else if (strcmp(messageType, kXPCMessageTypeGetStatus) == 0) {
        if (mStatusCallback) {
            xpc_object_t response = mStatusCallback();
            xpc_connection_send_message(peer, response);
            xpc_release(response);
        }
    }
}

} // namespace MusicianStream

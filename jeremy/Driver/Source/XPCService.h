#ifndef XPCService_h
#define XPCService_h

#include "Types.h"
#include <xpc/xpc.h>
#include <functional>
#include <mutex>

namespace MusicianStream {

class XPCService {
public:
    using ModeChangeCallback = std::function<void(AudioMode)>;
    using ThresholdChangeCallback = std::function<void(float)>;
    using StatusRequestCallback = std::function<xpc_object_t()>;

    XPCService();
    ~XPCService();

    bool start();
    void stop();

    void setModeChangeCallback(ModeChangeCallback callback);
    void setThresholdChangeCallback(ThresholdChangeCallback callback);
    void setStatusRequestCallback(StatusRequestCallback callback);

private:
    xpc_connection_t mListener;
    ModeChangeCallback mModeCallback;
    ThresholdChangeCallback mThresholdCallback;
    StatusRequestCallback mStatusCallback;
    std::mutex mCallbackMutex;

    void handleConnection(xpc_connection_t peer);
    void handleMessage(xpc_object_t message, xpc_connection_t peer);
    void sendErrorResponse(xpc_connection_t peer, const char* errorMessage);
};

} // namespace MusicianStream

#endif /* XPCService_h */

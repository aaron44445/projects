#ifndef XPCService_h
#define XPCService_h

#include "Types.h"
#include <xpc/xpc.h>
#include <functional>

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

    static void connectionHandler(xpc_connection_t peer);
    void handleConnection(xpc_connection_t peer);
    void handleMessage(xpc_object_t message, xpc_connection_t peer);
};

} // namespace MusicianStream

#endif /* XPCService_h */

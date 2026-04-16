#ifndef AudioProcessor_h
#define AudioProcessor_h

#include "Limiter.h"
#include "Types.h"
#include <cstdint>

namespace MusicianStream {

class AudioProcessor {
public:
    AudioProcessor(uint32_t sampleRate);
    ~AudioProcessor();

    void setMode(AudioMode mode);
    void setLimiterThreshold(float thresholdDb);

    void process(float** inputChannels,
                 uint32_t inputChannelCount,
                 float** outputChannels,
                 uint32_t outputChannelCount,
                 uint32_t frameCount);

private:
    AudioMode mMode;
    Limiter* mLeftLimiter;
    Limiter* mRightLimiter;
    float* mTempBuffer;
    uint32_t mTempBufferSize;
};

} // namespace MusicianStream

#endif /* AudioProcessor_h */

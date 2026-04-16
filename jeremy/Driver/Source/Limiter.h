#ifndef Limiter_h
#define Limiter_h

#include <cstdint>

namespace MusicianStream {

class Limiter {
public:
    Limiter(uint32_t sampleRate, float thresholdDb);
    ~Limiter();

    void process(float* buffer, uint32_t frameCount);
    void setThreshold(float thresholdDb);

private:
    uint32_t mSampleRate;
    float mThresholdLinear;
    float mAttackCoeff;
    float mReleaseCoeff;
    float mGainReduction;
    uint32_t mLookaheadSamples;
    float* mLookaheadBuffer;
    uint32_t mLookaheadIndex;
};

} // namespace MusicianStream

#endif /* Limiter_h */

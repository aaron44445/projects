#include "Limiter.h"
#include "Types.h"
#include <cmath>
#include <algorithm>
#include <cstring>

namespace MusicianStream {

Limiter::Limiter(uint32_t sampleRate, float thresholdDb)
    : mSampleRate(sampleRate)
    , mGainReduction(1.0f)
    , mLookaheadIndex(0)
{
    setThreshold(thresholdDb);

    // Calculate lookahead buffer size
    mLookaheadSamples = (kLimiterLookaheadMs * sampleRate) / 1000;
    mLookaheadBuffer = new float[mLookaheadSamples];
    std::memset(mLookaheadBuffer, 0, mLookaheadSamples * sizeof(float));

    // Calculate attack/release coefficients
    // Attack: time to reach 63% of target in kLimiterAttackMs
    // Release: time to reach 63% of target in kLimiterReleaseMs
    mAttackCoeff = std::exp(-1.0f / (kLimiterAttackMs * sampleRate / 1000.0f));
    mReleaseCoeff = std::exp(-1.0f / (kLimiterReleaseMs * sampleRate / 1000.0f));
}

Limiter::~Limiter() {
    delete[] mLookaheadBuffer;
}

void Limiter::setThreshold(float thresholdDb) {
    // Convert dB to linear
    mThresholdLinear = std::pow(10.0f, thresholdDb / 20.0f);
}

void Limiter::process(float* buffer, uint32_t frameCount) {
    for (uint32_t i = 0; i < frameCount; i++) {
        // Store current sample in lookahead buffer
        mLookaheadBuffer[mLookaheadIndex] = buffer[i];

        // Find peak in lookahead window
        float peak = 0.0f;
        for (uint32_t j = 0; j < mLookaheadSamples; j++) {
            peak = std::max(peak, std::abs(mLookaheadBuffer[j]));
        }

        // Calculate required gain reduction
        float targetGain = 1.0f;
        if (peak > mThresholdLinear) {
            targetGain = mThresholdLinear / peak;
        }

        // Smooth gain reduction with attack/release
        if (targetGain < mGainReduction) {
            // Attack: reduce gain quickly
            mGainReduction = targetGain + mAttackCoeff * (mGainReduction - targetGain);
        } else {
            // Release: restore gain slowly
            mGainReduction = targetGain + mReleaseCoeff * (mGainReduction - targetGain);
        }

        // Apply gain reduction to output
        buffer[i] *= mGainReduction;

        // Advance lookahead buffer index
        mLookaheadIndex = (mLookaheadIndex + 1) % mLookaheadSamples;
    }
}

} // namespace MusicianStream

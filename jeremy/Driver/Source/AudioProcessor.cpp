#include "AudioProcessor.h"
#include <algorithm>
#include <cstring>

namespace MusicianStream {

AudioProcessor::AudioProcessor(uint32_t sampleRate)
    : mMode(AudioMode::Stereo)
    , mLeftLimiter(nullptr)
    , mRightLimiter(nullptr)
    , mTempBuffer(nullptr)
    , mTempBufferSize(0)
{
    // Create limiters with default threshold (-1.0 dB)
    mLeftLimiter = new Limiter(sampleRate, -1.0f);
    mRightLimiter = new Limiter(sampleRate, -1.0f);
}

AudioProcessor::~AudioProcessor() {
    delete mLeftLimiter;
    delete mRightLimiter;
    delete[] mTempBuffer;
}

void AudioProcessor::setMode(AudioMode mode) {
    mMode = mode;
}

void AudioProcessor::setLimiterThreshold(float thresholdDb) {
    if (mLeftLimiter) {
        mLeftLimiter->setThreshold(thresholdDb);
    }
    if (mRightLimiter) {
        mRightLimiter->setThreshold(thresholdDb);
    }
}

void AudioProcessor::process(float** inputChannels,
                             uint32_t inputChannelCount,
                             float** outputChannels,
                             uint32_t outputChannelCount,
                             uint32_t frameCount)
{
    // Ensure we have output channels
    if (outputChannelCount < 2 || !outputChannels[0] || !outputChannels[1]) {
        return;
    }

    // Allocate temp buffer if needed (for limiter processing)
    if (mTempBufferSize < frameCount) {
        delete[] mTempBuffer;
        mTempBuffer = new float[frameCount];
        mTempBufferSize = frameCount;
    }

    if (mMode == AudioMode::Stereo) {
        // Stereo mode: L = Ch0 + Ch2, R = Ch1 + Ch2
        // Sum Piano L (Ch0) + Mic (Ch2) → Left output
        if (inputChannelCount >= 3 && inputChannels[0] && inputChannels[2]) {
            for (uint32_t i = 0; i < frameCount; i++) {
                outputChannels[0][i] = inputChannels[0][i] + inputChannels[2][i];
            }
        } else if (inputChannelCount >= 1 && inputChannels[0]) {
            std::memcpy(outputChannels[0], inputChannels[0], frameCount * sizeof(float));
        } else {
            std::memset(outputChannels[0], 0, frameCount * sizeof(float));
        }

        // Sum Piano R (Ch1) + Mic (Ch2) → Right output
        if (inputChannelCount >= 3 && inputChannels[1] && inputChannels[2]) {
            for (uint32_t i = 0; i < frameCount; i++) {
                outputChannels[1][i] = inputChannels[1][i] + inputChannels[2][i];
            }
        } else if (inputChannelCount >= 2 && inputChannels[1]) {
            std::memcpy(outputChannels[1], inputChannels[1], frameCount * sizeof(float));
        } else {
            std::memset(outputChannels[1], 0, frameCount * sizeof(float));
        }
    } else {
        // Mono mode: L = R = Ch0 + Ch1 + Ch2
        // Sum all three channels to both outputs
        std::memset(outputChannels[0], 0, frameCount * sizeof(float));

        for (uint32_t ch = 0; ch < std::min(inputChannelCount, 3u); ch++) {
            if (inputChannels[ch]) {
                for (uint32_t i = 0; i < frameCount; i++) {
                    outputChannels[0][i] += inputChannels[ch][i];
                }
            }
        }

        // Copy left to right
        std::memcpy(outputChannels[1], outputChannels[0], frameCount * sizeof(float));
    }

    // Apply limiters to both channels
    if (mLeftLimiter) {
        mLeftLimiter->process(outputChannels[0], frameCount);
    }
    if (mRightLimiter) {
        mRightLimiter->process(outputChannels[1], frameCount);
    }
}

} // namespace MusicianStream

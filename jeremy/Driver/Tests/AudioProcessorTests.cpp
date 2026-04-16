#include "../Source/AudioProcessor.h"
#include <cassert>
#include <cmath>
#include <iostream>

using namespace MusicianStream;

void test_stereo_mode_summing() {
    const uint32_t sampleRate = 48000;
    AudioProcessor processor(sampleRate);

    processor.setMode(AudioMode::Stereo);

    // Input: Piano L (Ch0), Piano R (Ch1), Mic (Ch2)
    const uint32_t frameCount = 4;
    float inputChannels[3][frameCount] = {
        {0.1f, 0.1f, 0.1f, 0.1f}, // Piano L
        {0.2f, 0.2f, 0.2f, 0.2f}, // Piano R
        {0.3f, 0.3f, 0.3f, 0.3f}  // Mic
    };

    float* inputPtrs[3] = {
        inputChannels[0],
        inputChannels[1],
        inputChannels[2]
    };

    float outputChannels[2][frameCount] = {{0}};
    float* outputPtrs[2] = {
        outputChannels[0], // Left
        outputChannels[1]  // Right
    };

    processor.process(inputPtrs, 3, outputPtrs, 2, frameCount);

    // Expected: Left = Ch0 + Ch2 = 0.1 + 0.3 = 0.4
    //           Right = Ch1 + Ch2 = 0.2 + 0.3 = 0.5
    const float expectedLeft = 0.4f;
    const float expectedRight = 0.5f;

    for (uint32_t i = 0; i < frameCount; i++) {
        assert(std::abs(outputChannels[0][i] - expectedLeft) < 0.001f);
        assert(std::abs(outputChannels[1][i] - expectedRight) < 0.001f);
    }

    std::cout << "✓ Stereo mode summing works correctly\n";
}

void test_mono_mode_summing() {
    const uint32_t sampleRate = 48000;
    AudioProcessor processor(sampleRate);

    processor.setMode(AudioMode::Mono);

    // Input: Piano L (Ch0), Piano R (Ch1), Mic (Ch2)
    const uint32_t frameCount = 4;
    float inputChannels[3][frameCount] = {
        {0.1f, 0.1f, 0.1f, 0.1f}, // Piano L
        {0.2f, 0.2f, 0.2f, 0.2f}, // Piano R
        {0.3f, 0.3f, 0.3f, 0.3f}  // Mic
    };

    float* inputPtrs[3] = {
        inputChannels[0],
        inputChannels[1],
        inputChannels[2]
    };

    float outputChannels[2][frameCount] = {{0}};
    float* outputPtrs[2] = {
        outputChannels[0], // Left
        outputChannels[1]  // Right
    };

    processor.process(inputPtrs, 3, outputPtrs, 2, frameCount);

    // Expected: Left = Right = Ch0 + Ch1 + Ch2 = 0.1 + 0.2 + 0.3 = 0.6
    const float expectedOutput = 0.6f;

    for (uint32_t i = 0; i < frameCount; i++) {
        assert(std::abs(outputChannels[0][i] - expectedOutput) < 0.001f);
        assert(std::abs(outputChannels[1][i] - expectedOutput) < 0.001f);
    }

    std::cout << "✓ Mono mode summing works correctly\n";
}

int main() {
    test_stereo_mode_summing();
    test_mono_mode_summing();
    std::cout << "All audio processor tests passed!\n";
    return 0;
}

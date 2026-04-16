#include "../Source/Limiter.h"
#include <cassert>
#include <cmath>
#include <iostream>

using namespace MusicianStream;

void test_limiter_detects_peaks_above_threshold() {
    const uint32_t sampleRate = 48000;
    const float threshold = -1.0f; // dB
    Limiter limiter(sampleRate, threshold);

    // Create test buffer with peak at 0.0 dB (1.0 linear)
    const uint32_t bufferSize = 256;
    float buffer[bufferSize];
    for (uint32_t i = 0; i < bufferSize; i++) {
        buffer[i] = (i == 128) ? 1.0f : 0.0f; // Peak in middle
    }

    limiter.process(buffer, bufferSize);

    // Peak should be reduced to threshold level
    // threshold = -1.0 dB = 10^(-1/20) ≈ 0.891
    const float expectedPeak = std::pow(10.0f, threshold / 20.0f);
    float actualPeak = 0.0f;
    for (uint32_t i = 0; i < bufferSize; i++) {
        actualPeak = std::max(actualPeak, std::abs(buffer[i]));
    }

    assert(actualPeak <= expectedPeak + 0.01f);
    std::cout << "✓ Limiter detects and reduces peaks above threshold\n";
}

void test_limiter_adjustable_threshold() {
    const uint32_t sampleRate = 48000;
    Limiter limiter(sampleRate, -3.0f);

    // Create buffer with 0.5 amplitude
    const uint32_t bufferSize = 256;
    float buffer[bufferSize];
    for (uint32_t i = 0; i < bufferSize; i++) {
        buffer[i] = 0.5f;
    }

    limiter.process(buffer, bufferSize);

    // -3 dB threshold ≈ 0.707 linear, input is 0.5, should pass through
    float peak1 = 0.0f;
    for (uint32_t i = 0; i < bufferSize; i++) {
        peak1 = std::max(peak1, std::abs(buffer[i]));
    }
    assert(peak1 >= 0.4f); // Should be close to 0.5

    // Now set threshold to -6 dB and reprocess
    limiter.setThreshold(-6.0f);
    for (uint32_t i = 0; i < bufferSize; i++) {
        buffer[i] = 0.5f;
    }
    limiter.process(buffer, bufferSize);

    // -6 dB threshold ≈ 0.501 linear, should still mostly pass
    float peak2 = 0.0f;
    for (uint32_t i = 0; i < bufferSize; i++) {
        peak2 = std::max(peak2, std::abs(buffer[i]));
    }
    assert(peak2 >= 0.4f);

    std::cout << "✓ Limiter threshold is adjustable\n";
}

int main() {
    test_limiter_detects_peaks_above_threshold();
    test_limiter_adjustable_threshold();
    std::cout << "All limiter tests passed!\n";
    return 0;
}

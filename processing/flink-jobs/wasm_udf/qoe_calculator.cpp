#include <emscripten.h>
#include <cmath>

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_qoe(float bitrate, float buffering_ratio, float startup_delay) {
    const float MAX_BITRATE = 10000.0f;
    const float MAX_DELAY = 5.0f;
    
    // Industry-standard QoE formula
    float bitrate_score = (bitrate / MAX_BITRATE);
    float buffering_penalty = (1.0f - buffering_ratio);
    float startup_penalty = (1.0f - fminf(startup_delay / MAX_DELAY, 1.0f));
    
    return (0.6f * bitrate_score) + 
           (0.3f * buffering_penalty) + 
           (0.1f * startup_penalty);
}

extern "C" EMSCRIPTEN_KEEPALIVE
int classify_qoe(float qoe_score) {
    if (qoe_score >= 0.8f) return 5; // Excellent
    if (qoe_score >= 0.6f) return 4; // Good
    if (qoe_score >= 0.4f) return 3; // Fair
    if (qoe_score >= 0.2f) return 2; // Poor
    return 1; // Bad
}
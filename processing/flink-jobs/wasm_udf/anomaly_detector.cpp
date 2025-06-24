#include <emscripten.h>
#include <cmath>

extern "C" EMSCRIPTEN_KEEPALIVE
int detect_anomaly(float buffering_ratio, float bitrate_variance, float network_quality) {
    // Isolation Forest-like scoring for video analytics
    float score = 0.0f;
    
    // Buffering anomaly (weight: 0.5)
    if (buffering_ratio > 0.15f) score += 0.5f;
    
    // Bitrate variance anomaly (weight: 0.3)
    if (bitrate_variance > 0.25f) score += 0.3f;
    
    // Network quality anomaly (weight: 0.2)
    if (network_quality < 0.3f) score += 0.2f;
    
    return score > 0.7f ? 1 : 0;
}

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_anomaly_score(float* features, int count) {
    float total_score = 0.0f;
    float weights[] = {0.4f, 0.3f, 0.2f, 0.1f}; // Max 4 features
    
    for (int i = 0; i < count && i < 4; i++) {
        total_score += features[i] * weights[i];
    }
    
    return fminf(total_score, 1.0f);
}

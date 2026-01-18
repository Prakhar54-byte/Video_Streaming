/**
 * Adaptive Bitrate Controller WebAssembly Module
 * Real-time bandwidth prediction and quality selection for HLS/DASH streaming
 */

#include <emscripten.h>
#include <cmath>
#include <cstring>
#include <cstdlib>

#ifndef M_E
#define M_E 2.71828182845904523536
#endif

// ============================================================================
// QUALITY LEVEL DEFINITIONS
// ============================================================================

// Quality levels (bitrates in kbps)
static const int QUALITY_BITRATES[] = {400, 800, 1500, 3000, 6000, 12000};
static const int NUM_QUALITIES = 6;

// Quality level names for reference:
// 0: 240p  (400 kbps)
// 1: 360p  (800 kbps)
// 2: 480p  (1500 kbps)
// 3: 720p  (3000 kbps)
// 4: 1080p (6000 kbps)
// 5: 4K    (12000 kbps)

// ============================================================================
// BANDWIDTH PREDICTION
// ============================================================================

/**
 * Predict bandwidth using exponential weighted moving average
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float predict_bandwidth(float* history, int history_length) {
    if (!history || history_length < 1) return 0.0f;
    
    // Use EWMA with alpha = 0.3 (more weight on recent measurements)
    float alpha = 0.3f;
    float ewma = history[0];
    
    for (int i = 1; i < history_length; i++) {
        ewma = alpha * history[i] + (1.0f - alpha) * ewma;
    }
    
    // Apply safety margin (use 80% of predicted bandwidth)
    return ewma * 0.8f;
}

/**
 * Advanced bandwidth prediction using harmonic mean (more conservative)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float predict_bandwidth_harmonic(float* history, int history_length) {
    if (!history || history_length < 1) return 0.0f;
    
    float sum_reciprocal = 0.0f;
    int valid_count = 0;
    
    for (int i = 0; i < history_length; i++) {
        if (history[i] > 0) {
            sum_reciprocal += 1.0f / history[i];
            valid_count++;
        }
    }
    
    if (valid_count == 0) return 0.0f;
    return (float)valid_count / sum_reciprocal;
}

/**
 * Detect bandwidth trend (increasing, stable, decreasing)
 * Returns: 1 = increasing, 0 = stable, -1 = decreasing
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int detect_bandwidth_trend(float* history, int history_length) {
    if (!history || history_length < 3) return 0;
    
    // Calculate simple linear regression slope
    float sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0;
    
    for (int i = 0; i < history_length; i++) {
        sum_x += i;
        sum_y += history[i];
        sum_xy += i * history[i];
        sum_xx += i * i;
    }
    
    float n = (float)history_length;
    float slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    float avg = sum_y / n;
    
    // Normalize slope relative to average
    float norm_slope = slope / avg;
    
    if (norm_slope > 0.1f) return 1;   // Increasing
    if (norm_slope < -0.1f) return -1; // Decreasing
    return 0; // Stable
}

// ============================================================================
// QUALITY SELECTION
// ============================================================================

/**
 * Select optimal quality level based on bandwidth and buffer
 * Uses BBA (Buffer-Based Adaptation) combined with throughput estimation
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int select_quality_level(float bandwidth, float buffer_level, int current_quality, int max_quality) {
    if (bandwidth <= 0) return 0;
    
    int target_quality = current_quality;
    int actual_max = (max_quality < NUM_QUALITIES) ? max_quality : NUM_QUALITIES - 1;
    
    // Buffer thresholds (in seconds)
    const float LOW_BUFFER = 5.0f;
    const float HIGH_BUFFER = 30.0f;
    const float CRITICAL_BUFFER = 2.0f;
    
    // Critical buffer - drop to lowest quality immediately
    if (buffer_level < CRITICAL_BUFFER) {
        return 0;
    }
    
    // Find highest quality that fits bandwidth
    int bandwidth_quality = 0;
    for (int i = 0; i <= actual_max; i++) {
        if (QUALITY_BITRATES[i] <= bandwidth * 0.9f) { // 90% safety margin
            bandwidth_quality = i;
        }
    }
    
    // Buffer-based adaptation
    if (buffer_level < LOW_BUFFER) {
        // Low buffer - be conservative, decrease if needed
        target_quality = (current_quality > 0) ? current_quality - 1 : 0;
        target_quality = (target_quality < bandwidth_quality) ? target_quality : bandwidth_quality;
    } else if (buffer_level > HIGH_BUFFER) {
        // High buffer - can be aggressive, increase quality
        target_quality = (current_quality < actual_max) ? current_quality + 1 : current_quality;
        target_quality = (target_quality <= bandwidth_quality) ? target_quality : bandwidth_quality;
    } else {
        // Medium buffer - stable adaptation
        // Only switch if bandwidth supports it clearly
        if (bandwidth_quality > current_quality && bandwidth > QUALITY_BITRATES[current_quality + 1] * 1.2f) {
            target_quality = current_quality + 1;
        } else if (bandwidth_quality < current_quality) {
            target_quality = bandwidth_quality;
        } else {
            target_quality = current_quality;
        }
    }
    
    // Ensure bounds
    if (target_quality < 0) target_quality = 0;
    if (target_quality > actual_max) target_quality = actual_max;
    
    return target_quality;
}

/**
 * Select quality with oscillation prevention
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int select_quality_stable(float bandwidth, float buffer_level, int current_quality, 
                          int max_quality, int* switch_history, int history_length) {
    // Get base recommendation
    int recommended = select_quality_level(bandwidth, buffer_level, current_quality, max_quality);
    
    // Count recent switches
    int recent_switches = 0;
    if (switch_history && history_length > 0) {
        for (int i = history_length - 5; i < history_length && i >= 0; i++) {
            if (switch_history[i] != current_quality) recent_switches++;
        }
    }
    
    // If too many recent switches, be more conservative
    if (recent_switches >= 3) {
        // Avoid small changes
        if (abs(recommended - current_quality) == 1) {
            return current_quality;
        }
    }
    
    return recommended;
}

// ============================================================================
// BUFFER HEALTH
// ============================================================================

/**
 * Calculate buffer health score (0.0 - 1.0)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_buffer_health(float buffer_seconds, float segment_duration) {
    if (segment_duration <= 0) return 0.0f;
    
    // Target: 4-6 segments worth of buffer
    float target_buffer = segment_duration * 5.0f;
    float max_buffer = segment_duration * 10.0f;
    
    if (buffer_seconds <= 0) return 0.0f;
    if (buffer_seconds >= target_buffer) return 1.0f;
    
    // Linear interpolation below target
    return buffer_seconds / target_buffer;
}

/**
 * Calculate rebuffer probability
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_rebuffer_probability(float buffer_seconds, float download_time, float segment_duration) {
    if (buffer_seconds <= 0) return 1.0f;
    if (download_time <= 0) return 0.0f;
    
    // Time until rebuffer = buffer / (1 - download_rate)
    float download_rate = download_time / segment_duration;
    
    if (download_rate >= 1.0f) {
        // Download slower than playback - will rebuffer
        return 1.0f;
    }
    
    float time_to_rebuffer = buffer_seconds / (1.0f - download_rate);
    
    // Probability based on buffer depletion timeline
    if (time_to_rebuffer > 30.0f) return 0.0f;
    if (time_to_rebuffer < 5.0f) return 0.9f;
    
    return 1.0f - (time_to_rebuffer / 30.0f);
}

// ============================================================================
// QoE ESTIMATION
// ============================================================================

/**
 * Calculate estimated QoE score for a quality level
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float estimate_qoe(int quality_level, float rebuffer_probability, float switch_penalty) {
    if (quality_level < 0 || quality_level >= NUM_QUALITIES) return 0.0f;
    
    // Quality score (normalized 0-1)
    float quality_score = (float)quality_level / (NUM_QUALITIES - 1);
    
    // Rebuffer penalty (very impactful on QoE)
    float rebuffer_cost = rebuffer_probability * 0.5f;
    
    // Quality switch penalty
    float switch_cost = switch_penalty * 0.1f;
    
    float qoe = quality_score - rebuffer_cost - switch_cost;
    return fmaxf(0.0f, fminf(1.0f, qoe));
}

/**
 * Select quality that maximizes QoE
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int select_quality_maximize_qoe(float bandwidth, float buffer_seconds, float segment_duration,
                                int current_quality, int max_quality) {
    int best_quality = 0;
    float best_qoe = -1.0f;
    int actual_max = (max_quality < NUM_QUALITIES) ? max_quality : NUM_QUALITIES - 1;
    
    for (int q = 0; q <= actual_max; q++) {
        // Estimate download time for this quality
        float download_time = (QUALITY_BITRATES[q] * segment_duration) / bandwidth;
        
        // Calculate rebuffer probability
        float rebuffer_prob = calculate_rebuffer_probability(buffer_seconds, download_time, segment_duration);
        
        // Switch penalty
        float switch_penalty = (q != current_quality) ? 1.0f : 0.0f;
        
        // Calculate QoE
        float qoe = estimate_qoe(q, rebuffer_prob, switch_penalty);
        
        if (qoe > best_qoe) {
            best_qoe = qoe;
            best_quality = q;
        }
    }
    
    return best_quality;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate bandwidth variance (for stability detection)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_bandwidth_variance(float* history, int history_length) {
    if (!history || history_length < 2) return 0.0f;
    
    float mean = 0.0f;
    for (int i = 0; i < history_length; i++) mean += history[i];
    mean /= history_length;
    
    float variance = 0.0f;
    for (int i = 0; i < history_length; i++) {
        float diff = history[i] - mean;
        variance += diff * diff;
    }
    
    return variance / (history_length - 1);
}

/**
 * Get recommended quality based on all factors
 * Returns: [quality_level, confidence, rebuffer_risk, estimated_qoe]
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* get_comprehensive_recommendation(float* bandwidth_history, int history_length,
                                        float buffer_seconds, float segment_duration,
                                        int current_quality, int max_quality) {
    float* result = (float*)malloc(4 * sizeof(float));
    if (!result) return nullptr;
    
    float predicted_bw = predict_bandwidth(bandwidth_history, history_length);
    float bw_variance = calculate_bandwidth_variance(bandwidth_history, history_length);
    int trend = detect_bandwidth_trend(bandwidth_history, history_length);
    
    // Adjust prediction based on trend
    if (trend == -1) predicted_bw *= 0.85f; // Decreasing - be more conservative
    if (trend == 1) predicted_bw *= 1.1f;   // Increasing - can be slightly aggressive
    
    // Calculate confidence based on variance
    float avg_bw = predicted_bw;
    float confidence = 1.0f - fminf(sqrtf(bw_variance) / avg_bw, 1.0f);
    
    // Select quality
    int quality = select_quality_maximize_qoe(predicted_bw, buffer_seconds, segment_duration,
                                               current_quality, max_quality);
    
    // Calculate rebuffer risk
    float download_time = (QUALITY_BITRATES[quality] * segment_duration) / predicted_bw;
    float rebuffer_risk = calculate_rebuffer_probability(buffer_seconds, download_time, segment_duration);
    
    // Calculate QoE
    float qoe = estimate_qoe(quality, rebuffer_risk, (quality != current_quality) ? 1.0f : 0.0f);
    
    result[0] = (float)quality;
    result[1] = confidence;
    result[2] = rebuffer_risk;
    result[3] = qoe;
    
    return result;
}

// Memory management
extern "C" EMSCRIPTEN_KEEPALIVE
void* wasm_malloc(int size) { return malloc(size); }

extern "C" EMSCRIPTEN_KEEPALIVE
void wasm_free(void* ptr) { free(ptr); }

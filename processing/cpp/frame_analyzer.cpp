/**
 * Frame Analyzer WebAssembly Module
 * High-performance video frame analysis for scene detection, quality assessment
 */

#include <emscripten.h>
#include <cmath>
#include <cstring>
#include <cstdint>
#include <cstdlib>

// ============================================================================
// SCENE CHANGE DETECTION
// ============================================================================

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_scene_change_score(uint8_t* prev_frame, uint8_t* curr_frame, int width, int height) {
    if (!prev_frame || !curr_frame || width <= 0 || height <= 0) return 0.0f;
    
    const int HISTOGRAM_BINS = 64;
    int prev_hist[HISTOGRAM_BINS] = {0};
    int curr_hist[HISTOGRAM_BINS] = {0};
    
    int total_pixels = width * height;
    int bin_size = 256 / HISTOGRAM_BINS;
    
    // Build luminance histograms
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        int prev_lum = (int)(0.299f * prev_frame[idx] + 0.587f * prev_frame[idx+1] + 0.114f * prev_frame[idx+2]);
        int curr_lum = (int)(0.299f * curr_frame[idx] + 0.587f * curr_frame[idx+1] + 0.114f * curr_frame[idx+2]);
        prev_hist[prev_lum / bin_size]++;
        curr_hist[curr_lum / bin_size]++;
    }
    
    // Bhattacharyya distance
    float bc = 0.0f;
    for (int i = 0; i < HISTOGRAM_BINS; i++) {
        bc += sqrtf((float)prev_hist[i] * curr_hist[i]);
    }
    bc /= total_pixels;
    
    return 1.0f - bc;
}

extern "C" EMSCRIPTEN_KEEPALIVE
int detect_scene_changes(uint8_t* frames_data, int frame_count, int width, int height, 
                         float threshold, int* output_indices) {
    if (!frames_data || frame_count < 2 || !output_indices) return 0;
    
    int frame_size = width * height * 3;
    int count = 0;
    
    for (int i = 1; i < frame_count; i++) {
        uint8_t* prev = frames_data + (i - 1) * frame_size;
        uint8_t* curr = frames_data + i * frame_size;
        
        if (calculate_scene_change_score(prev, curr, width, height) > threshold) {
            output_indices[count++] = i;
        }
    }
    return count;
}

// ============================================================================
// BLACK FRAME DETECTION
// ============================================================================

extern "C" EMSCRIPTEN_KEEPALIVE
int detect_black_frames(uint8_t* frame_data, int width, int height, float threshold) {
    if (!frame_data || width <= 0 || height <= 0) return 0;
    
    int total_pixels = width * height;
    int dark_pixels = 0;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        float lum = 0.299f * frame_data[idx] + 0.587f * frame_data[idx+1] + 0.114f * frame_data[idx+2];
        if (lum < threshold) dark_pixels++;
    }
    
    return (dark_pixels > total_pixels * 0.95f) ? 1 : 0;
}

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_frame_brightness(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width <= 0 || height <= 0) return 0.0f;
    
    int total_pixels = width * height;
    float total_lum = 0.0f;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        total_lum += 0.299f * frame_data[idx] + 0.587f * frame_data[idx+1] + 0.114f * frame_data[idx+2];
    }
    return total_lum / total_pixels;
}

// ============================================================================
// MOTION INTENSITY
// ============================================================================

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_motion_intensity(uint8_t* prev_frame, uint8_t* curr_frame, int width, int height) {
    if (!prev_frame || !curr_frame || width <= 0 || height <= 0) return 0.0f;
    
    int total_pixels = width * height;
    float total_diff = 0.0f;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        int diff = abs((int)curr_frame[idx] - (int)prev_frame[idx]) +
                   abs((int)curr_frame[idx+1] - (int)prev_frame[idx+1]) +
                   abs((int)curr_frame[idx+2] - (int)prev_frame[idx+2]);
        total_diff += diff / 3.0f;
    }
    return (total_diff / total_pixels) / 255.0f;
}

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_average_motion(uint8_t* frames_data, int frame_count, int width, int height) {
    if (!frames_data || frame_count < 2) return 0.0f;
    
    int frame_size = width * height * 3;
    float total = 0.0f;
    
    for (int i = 1; i < frame_count; i++) {
        total += calculate_motion_intensity(
            frames_data + (i-1) * frame_size,
            frames_data + i * frame_size,
            width, height
        );
    }
    return total / (frame_count - 1);
}

// ============================================================================
// FRAME QUALITY ASSESSMENT
// ============================================================================

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_sharpness(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width < 3 || height < 3) return 0.0f;
    
    float sum = 0.0f, sum_sq = 0.0f;
    int count = 0;
    
    for (int y = 1; y < height - 1; y++) {
        for (int x = 1; x < width - 1; x++) {
            int idx = (y * width + x) * 3;
            float center = 0.299f * frame_data[idx] + 0.587f * frame_data[idx+1] + 0.114f * frame_data[idx+2];
            
            int idx_up = ((y-1) * width + x) * 3;
            int idx_down = ((y+1) * width + x) * 3;
            int idx_left = (y * width + (x-1)) * 3;
            int idx_right = (y * width + (x+1)) * 3;
            
            float lap = -4.0f * center +
                (0.299f * frame_data[idx_up] + 0.587f * frame_data[idx_up+1] + 0.114f * frame_data[idx_up+2]) +
                (0.299f * frame_data[idx_down] + 0.587f * frame_data[idx_down+1] + 0.114f * frame_data[idx_down+2]) +
                (0.299f * frame_data[idx_left] + 0.587f * frame_data[idx_left+1] + 0.114f * frame_data[idx_left+2]) +
                (0.299f * frame_data[idx_right] + 0.587f * frame_data[idx_right+1] + 0.114f * frame_data[idx_right+2]);
            
            sum += lap;
            sum_sq += lap * lap;
            count++;
        }
    }
    
    float mean = sum / count;
    return (sum_sq / count) - (mean * mean);
}

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_contrast(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width <= 0 || height <= 0) return 0.0f;
    
    float min_lum = 255.0f, max_lum = 0.0f;
    int total_pixels = width * height;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        float lum = 0.299f * frame_data[idx] + 0.587f * frame_data[idx+1] + 0.114f * frame_data[idx+2];
        if (lum < min_lum) min_lum = lum;
        if (lum > max_lum) max_lum = lum;
    }
    
    return (max_lum + min_lum > 0) ? (max_lum - min_lum) / (max_lum + min_lum) : 0.0f;
}

extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_frame_quality(uint8_t* frame_data, int width, int height) {
    float brightness = calculate_frame_brightness(frame_data, width, height);
    float contrast = calculate_contrast(frame_data, width, height);
    float sharpness = calculate_sharpness(frame_data, width, height);
    
    float norm_sharpness = fminf(sharpness / 5000.0f, 1.0f);
    float brightness_score = 1.0f - fabsf(brightness - 127.5f) / 127.5f;
    
    return fmaxf(0.0f, fminf(100.0f, (0.4f * norm_sharpness + 0.3f * contrast + 0.3f * brightness_score) * 100.0f));
}

// ============================================================================
// KEYFRAME SELECTION
// ============================================================================

extern "C" EMSCRIPTEN_KEEPALIVE
int select_best_keyframe(uint8_t* frames_data, int frame_count, int width, int height) {
    if (!frames_data || frame_count < 1) return 0;
    
    int frame_size = width * height * 3;
    float best_score = -1.0f;
    int best_idx = 0;
    
    for (int i = 0; i < frame_count; i++) {
        uint8_t* frame = frames_data + i * frame_size;
        if (detect_black_frames(frame, width, height, 20)) continue;
        
        float quality = calculate_frame_quality(frame, width, height);
        if (quality > best_score) {
            best_score = quality;
            best_idx = i;
        }
    }
    return best_idx;
}

extern "C" EMSCRIPTEN_KEEPALIVE
int select_representative_keyframes(uint8_t* frames_data, int frame_count, int width, int height,
                                    int num_keyframes, int* output_indices) {
    if (!frames_data || frame_count < 1 || !output_indices) return 0;
    
    int frame_size = width * height * 3;
    int segment_size = frame_count / num_keyframes;
    int selected = 0;
    
    for (int seg = 0; seg < num_keyframes; seg++) {
        int start = seg * segment_size;
        int end = (seg == num_keyframes - 1) ? frame_count : (seg + 1) * segment_size;
        
        float best_score = -1.0f;
        int best_idx = start;
        
        for (int i = start; i < end; i++) {
            uint8_t* frame = frames_data + i * frame_size;
            if (detect_black_frames(frame, width, height, 20)) continue;
            
            float quality = calculate_frame_quality(frame, width, height);
            if (quality > best_score) {
                best_score = quality;
                best_idx = i;
            }
        }
        output_indices[selected++] = best_idx;
    }
    return selected;
}

// Memory helpers
extern "C" EMSCRIPTEN_KEEPALIVE
void* wasm_malloc(int size) { return malloc(size); }

extern "C" EMSCRIPTEN_KEEPALIVE
void wasm_free(void* ptr) { free(ptr); }

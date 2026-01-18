/**
 * Color Analyzer WebAssembly Module
 * Advanced color analysis for thumbnail selection and video categorization
 */

#include <emscripten.h>
#include <cmath>
#include <cstring>
#include <cstdint>
#include <cstdlib>

// ============================================================================
// COLOR HISTOGRAM
// ============================================================================

/**
 * Calculate RGB color histogram
 * Returns array of size bins*3 (R, G, B histograms concatenated)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* calculate_color_histogram(uint8_t* frame_data, int width, int height, int bins) {
    if (!frame_data || width <= 0 || height <= 0 || bins < 1) return nullptr;
    
    float* histogram = (float*)calloc(bins * 3, sizeof(float));
    if (!histogram) return nullptr;
    
    int total_pixels = width * height;
    int bin_size = 256 / bins;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        histogram[frame_data[idx] / bin_size]++;                    // R
        histogram[bins + frame_data[idx + 1] / bin_size]++;         // G
        histogram[2 * bins + frame_data[idx + 2] / bin_size]++;     // B
    }
    
    // Normalize
    for (int i = 0; i < bins * 3; i++) {
        histogram[i] /= total_pixels;
    }
    
    return histogram;
}

/**
 * Calculate HSV histogram (more perceptually meaningful)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* calculate_hsv_histogram(uint8_t* frame_data, int width, int height, 
                               int h_bins, int s_bins, int v_bins) {
    if (!frame_data || width <= 0 || height <= 0) return nullptr;
    
    int total_bins = h_bins + s_bins + v_bins;
    float* histogram = (float*)calloc(total_bins, sizeof(float));
    if (!histogram) return nullptr;
    
    int total_pixels = width * height;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        float r = frame_data[idx] / 255.0f;
        float g = frame_data[idx + 1] / 255.0f;
        float b = frame_data[idx + 2] / 255.0f;
        
        // RGB to HSV conversion
        float max_val = fmaxf(r, fmaxf(g, b));
        float min_val = fminf(r, fminf(g, b));
        float delta = max_val - min_val;
        
        float h = 0, s = 0, v = max_val;
        
        if (max_val > 0 && delta > 0) {
            s = delta / max_val;
            
            if (r == max_val) {
                h = 60.0f * fmodf((g - b) / delta, 6.0f);
            } else if (g == max_val) {
                h = 60.0f * ((b - r) / delta + 2.0f);
            } else {
                h = 60.0f * ((r - g) / delta + 4.0f);
            }
            
            if (h < 0) h += 360.0f;
        }
        
        // Bin the values
        int h_bin = (int)(h / 360.0f * h_bins) % h_bins;
        int s_bin = (int)(s * s_bins);
        int v_bin = (int)(v * v_bins);
        
        if (s_bin >= s_bins) s_bin = s_bins - 1;
        if (v_bin >= v_bins) v_bin = v_bins - 1;
        
        histogram[h_bin]++;
        histogram[h_bins + s_bin]++;
        histogram[h_bins + s_bins + v_bin]++;
    }
    
    // Normalize
    for (int i = 0; i < total_bins; i++) {
        histogram[i] /= total_pixels;
    }
    
    return histogram;
}

// ============================================================================
// COLOR METRICS
// ============================================================================

/**
 * Calculate colorfulness score using Hasler & Süsstrunk method
 * Higher values indicate more colorful images
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_colorfulness_score(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width <= 0 || height <= 0) return 0.0f;
    
    int total_pixels = width * height;
    
    double sum_rg = 0, sum_yb = 0;
    double sum_rg_sq = 0, sum_yb_sq = 0;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        float r = frame_data[idx];
        float g = frame_data[idx + 1];
        float b = frame_data[idx + 2];
        
        // rg = R - G, yb = 0.5*(R+G) - B
        float rg = r - g;
        float yb = 0.5f * (r + g) - b;
        
        sum_rg += rg;
        sum_yb += yb;
        sum_rg_sq += rg * rg;
        sum_yb_sq += yb * yb;
    }
    
    // Calculate standard deviations and means
    double mean_rg = sum_rg / total_pixels;
    double mean_yb = sum_yb / total_pixels;
    double std_rg = sqrtf((sum_rg_sq / total_pixels) - (mean_rg * mean_rg));
    double std_yb = sqrtf((sum_yb_sq / total_pixels) - (mean_yb * mean_yb));
    
    // Colorfulness metric
    double std_root = sqrtf(std_rg * std_rg + std_yb * std_yb);
    double mean_root = sqrtf(mean_rg * mean_rg + mean_yb * mean_yb);
    
    return (float)(std_root + 0.3f * mean_root);
}

/**
 * Calculate dominant color (mode of histogram)
 * Returns [R, G, B] of dominant color
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* calculate_dominant_color(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width <= 0 || height <= 0) return nullptr;
    
    float* result = (float*)malloc(3 * sizeof(float));
    if (!result) return nullptr;
    
    // Use 16-bin histogram for each channel
    int bins = 16;
    int histogram_r[16] = {0};
    int histogram_g[16] = {0};
    int histogram_b[16] = {0};
    
    int total_pixels = width * height;
    int bin_size = 256 / bins;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        histogram_r[frame_data[idx] / bin_size]++;
        histogram_g[frame_data[idx + 1] / bin_size]++;
        histogram_b[frame_data[idx + 2] / bin_size]++;
    }
    
    // Find peak bins
    int max_r = 0, max_g = 0, max_b = 0;
    int peak_r = 0, peak_g = 0, peak_b = 0;
    
    for (int i = 0; i < bins; i++) {
        if (histogram_r[i] > max_r) { max_r = histogram_r[i]; peak_r = i; }
        if (histogram_g[i] > max_g) { max_g = histogram_g[i]; peak_g = i; }
        if (histogram_b[i] > max_b) { max_b = histogram_b[i]; peak_b = i; }
    }
    
    // Convert bin to color value (center of bin)
    result[0] = (peak_r * bin_size + bin_size / 2);
    result[1] = (peak_g * bin_size + bin_size / 2);
    result[2] = (peak_b * bin_size + bin_size / 2);
    
    return result;
}

/**
 * Calculate color palette (top N colors)
 * Uses k-means clustering
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* extract_color_palette(uint8_t* frame_data, int width, int height, int num_colors) {
    if (!frame_data || width <= 0 || height <= 0 || num_colors < 1) return nullptr;
    
    float* palette = (float*)malloc(num_colors * 3 * sizeof(float));
    if (!palette) return nullptr;
    
    int total_pixels = width * height;
    int sample_step = (total_pixels > 10000) ? total_pixels / 10000 : 1;
    int sample_count = total_pixels / sample_step;
    
    // Initialize centroids randomly from image
    for (int c = 0; c < num_colors; c++) {
        int idx = ((c * total_pixels / num_colors) % total_pixels) * 3;
        palette[c * 3] = frame_data[idx];
        palette[c * 3 + 1] = frame_data[idx + 1];
        palette[c * 3 + 2] = frame_data[idx + 2];
    }
    
    // K-means iterations
    int* assignments = (int*)malloc(sample_count * sizeof(int));
    float* new_centroids = (float*)calloc(num_colors * 3, sizeof(float));
    int* counts = (int*)calloc(num_colors, sizeof(int));
    
    if (!assignments || !new_centroids || !counts) {
        free(palette); free(assignments); free(new_centroids); free(counts);
        return nullptr;
    }
    
    for (int iter = 0; iter < 10; iter++) {
        // Assign pixels to nearest centroid
        for (int i = 0; i < sample_count; i++) {
            int pixel_idx = (i * sample_step) * 3;
            float r = frame_data[pixel_idx];
            float g = frame_data[pixel_idx + 1];
            float b = frame_data[pixel_idx + 2];
            
            float min_dist = 1e10f;
            int best_c = 0;
            
            for (int c = 0; c < num_colors; c++) {
                float dr = r - palette[c * 3];
                float dg = g - palette[c * 3 + 1];
                float db = b - palette[c * 3 + 2];
                float dist = dr * dr + dg * dg + db * db;
                
                if (dist < min_dist) {
                    min_dist = dist;
                    best_c = c;
                }
            }
            
            assignments[i] = best_c;
        }
        
        // Update centroids
        memset(new_centroids, 0, num_colors * 3 * sizeof(float));
        memset(counts, 0, num_colors * sizeof(int));
        
        for (int i = 0; i < sample_count; i++) {
            int pixel_idx = (i * sample_step) * 3;
            int c = assignments[i];
            
            new_centroids[c * 3] += frame_data[pixel_idx];
            new_centroids[c * 3 + 1] += frame_data[pixel_idx + 1];
            new_centroids[c * 3 + 2] += frame_data[pixel_idx + 2];
            counts[c]++;
        }
        
        for (int c = 0; c < num_colors; c++) {
            if (counts[c] > 0) {
                palette[c * 3] = new_centroids[c * 3] / counts[c];
                palette[c * 3 + 1] = new_centroids[c * 3 + 1] / counts[c];
                palette[c * 3 + 2] = new_centroids[c * 3 + 2] / counts[c];
            }
        }
    }
    
    free(assignments);
    free(new_centroids);
    free(counts);
    
    return palette;
}

// ============================================================================
// THUMBNAIL SELECTION
// ============================================================================

/**
 * Calculate thumbnail score for a frame
 * Considers colorfulness, contrast, brightness, and sharpness
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_thumbnail_score(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width <= 0 || height <= 0) return 0.0f;
    
    // Calculate colorfulness
    float colorfulness = calculate_colorfulness_score(frame_data, width, height);
    float norm_colorfulness = fminf(colorfulness / 100.0f, 1.0f);
    
    // Calculate brightness
    int total_pixels = width * height;
    float total_brightness = 0.0f;
    
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        total_brightness += 0.299f * frame_data[idx] + 
                           0.587f * frame_data[idx + 1] + 
                           0.114f * frame_data[idx + 2];
    }
    float avg_brightness = total_brightness / total_pixels;
    
    // Brightness score (prefer mid-range brightness)
    float brightness_score = 1.0f - fabsf(avg_brightness - 127.5f) / 127.5f;
    
    // Calculate contrast
    float min_lum = 255.0f, max_lum = 0.0f;
    for (int i = 0; i < total_pixels; i++) {
        int idx = i * 3;
        float lum = 0.299f * frame_data[idx] + 0.587f * frame_data[idx + 1] + 0.114f * frame_data[idx + 2];
        if (lum < min_lum) min_lum = lum;
        if (lum > max_lum) max_lum = lum;
    }
    float contrast = (max_lum + min_lum > 0) ? (max_lum - min_lum) / (max_lum + min_lum) : 0.0f;
    
    // Weighted score
    float score = 0.35f * norm_colorfulness + 
                  0.30f * brightness_score + 
                  0.35f * contrast;
    
    return score * 100.0f;
}

/**
 * Select best thumbnail frame from multiple frames
 * Returns index of best frame
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int select_best_thumbnail_frame(uint8_t* frames_data, int frame_count, int width, int height) {
    if (!frames_data || frame_count < 1) return 0;
    
    int frame_size = width * height * 3;
    float best_score = -1.0f;
    int best_idx = 0;
    
    for (int i = 0; i < frame_count; i++) {
        uint8_t* frame = frames_data + i * frame_size;
        
        // Skip very dark frames
        float total_brightness = 0.0f;
        for (int p = 0; p < width * height; p++) {
            int idx = p * 3;
            total_brightness += frame[idx] + frame[idx + 1] + frame[idx + 2];
        }
        if (total_brightness / (width * height * 3) < 30) continue;
        
        float score = calculate_thumbnail_score(frame, width, height);
        
        if (score > best_score) {
            best_score = score;
            best_idx = i;
        }
    }
    
    return best_idx;
}

/**
 * Select best thumbnail using histogram comparison
 * Returns index of best frame (avoiding similar frames)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int select_best_thumbnail_from_histograms(float* histograms, int frame_count, int bins_per_channel) {
    if (!histograms || frame_count < 1) return 0;
    
    int histogram_size = bins_per_channel * 3;
    float best_score = -1.0f;
    int best_idx = 0;
    
    for (int i = 0; i < frame_count; i++) {
        float* hist = histograms + i * histogram_size;
        
        // Score based on histogram distribution (prefer diverse colors)
        float diversity = 0.0f;
        int non_zero_bins = 0;
        
        for (int j = 0; j < histogram_size; j++) {
            if (hist[j] > 0.01f) {
                diversity += hist[j] * logf(hist[j] + 1e-10f); // Entropy-like measure
                non_zero_bins++;
            }
        }
        
        // Prefer frames with more distributed colors
        float score = (float)non_zero_bins / histogram_size - diversity;
        
        if (score > best_score) {
            best_score = score;
            best_idx = i;
        }
    }
    
    return best_idx;
}

// ============================================================================
// COLOR DISTANCE
// ============================================================================

/**
 * Calculate color distance (CIE76)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_color_distance(float r1, float g1, float b1, float r2, float g2, float b2) {
    // Simple Euclidean distance in RGB (CIE76 approximation)
    float dr = r1 - r2;
    float dg = g1 - g2;
    float db = b1 - b2;
    
    return sqrtf(dr * dr + dg * dg + db * db);
}

/**
 * Compare two color histograms
 * Returns similarity score (0.0 - 1.0)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float compare_color_histograms(float* hist1, float* hist2, int size) {
    if (!hist1 || !hist2 || size < 1) return 0.0f;
    
    // Histogram intersection
    float intersection = 0.0f;
    
    for (int i = 0; i < size; i++) {
        intersection += fminf(hist1[i], hist2[i]);
    }
    
    return intersection;
}

// Memory management
extern "C" EMSCRIPTEN_KEEPALIVE
void* wasm_malloc(int size) { return malloc(size); }

extern "C" EMSCRIPTEN_KEEPALIVE
void wasm_free(void* ptr) { free(ptr); }

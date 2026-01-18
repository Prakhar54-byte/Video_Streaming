/**
 * Audio Fingerprinting WebAssembly Module
 * High-performance audio analysis for intro detection and content matching
 */

#include <emscripten.h>
#include <cmath>
#include <cstring>
#include <cstdint>
#include <cstdlib>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// ============================================================================
// FFT IMPLEMENTATION (Cooley-Tukey)
// ============================================================================

static void fft_internal(float* real, float* imag, int n, int inverse) {
    // Bit-reversal permutation
    for (int i = 1, j = 0; i < n; i++) {
        int bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            float temp = real[i]; real[i] = real[j]; real[j] = temp;
            temp = imag[i]; imag[i] = imag[j]; imag[j] = temp;
        }
    }
    
    // Cooley-Tukey FFT
    for (int len = 2; len <= n; len <<= 1) {
        float angle = (inverse ? 1 : -1) * 2.0f * M_PI / len;
        float wpr = cosf(angle);
        float wpi = sinf(angle);
        
        for (int i = 0; i < n; i += len) {
            float wr = 1.0f, wi = 0.0f;
            for (int j = 0; j < len / 2; j++) {
                int u = i + j;
                int v = i + j + len / 2;
                float tr = wr * real[v] - wi * imag[v];
                float ti = wr * imag[v] + wi * real[v];
                real[v] = real[u] - tr;
                imag[v] = imag[u] - ti;
                real[u] += tr;
                imag[u] += ti;
                float temp = wr;
                wr = wr * wpr - wi * wpi;
                wi = temp * wpi + wi * wpr;
            }
        }
    }
    
    if (inverse) {
        for (int i = 0; i < n; i++) {
            real[i] /= n;
            imag[i] /= n;
        }
    }
}

// ============================================================================
// SPECTROGRAM COMPUTATION
// ============================================================================

/**
 * Compute audio spectrogram using STFT
 * Returns power spectrum data for visualization and analysis
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* compute_audio_spectrogram(float* audio_samples, int sample_count, int fft_size) {
    if (!audio_samples || sample_count < fft_size || fft_size < 64) return nullptr;
    
    int hop_size = fft_size / 4;
    int num_frames = (sample_count - fft_size) / hop_size + 1;
    int num_bins = fft_size / 2 + 1;
    
    float* spectrogram = (float*)malloc(num_frames * num_bins * sizeof(float));
    if (!spectrogram) return nullptr;
    
    float* real = (float*)malloc(fft_size * sizeof(float));
    float* imag = (float*)malloc(fft_size * sizeof(float));
    float* window = (float*)malloc(fft_size * sizeof(float));
    
    if (!real || !imag || !window) {
        free(spectrogram); free(real); free(imag); free(window);
        return nullptr;
    }
    
    // Hann window
    for (int i = 0; i < fft_size; i++) {
        window[i] = 0.5f * (1.0f - cosf(2.0f * M_PI * i / (fft_size - 1)));
    }
    
    for (int frame = 0; frame < num_frames; frame++) {
        int offset = frame * hop_size;
        
        // Apply window and prepare FFT input
        for (int i = 0; i < fft_size; i++) {
            real[i] = audio_samples[offset + i] * window[i];
            imag[i] = 0.0f;
        }
        
        fft_internal(real, imag, fft_size, 0);
        
        // Compute power spectrum (magnitude squared)
        for (int i = 0; i < num_bins; i++) {
            float mag = sqrtf(real[i] * real[i] + imag[i] * imag[i]);
            spectrogram[frame * num_bins + i] = 20.0f * log10f(fmaxf(mag, 1e-10f)); // dB scale
        }
    }
    
    free(real); free(imag); free(window);
    return spectrogram;
}

/**
 * Get spectrogram dimensions
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int get_spectrogram_frames(int sample_count, int fft_size) {
    int hop_size = fft_size / 4;
    return (sample_count - fft_size) / hop_size + 1;
}

extern "C" EMSCRIPTEN_KEEPALIVE
int get_spectrogram_bins(int fft_size) {
    return fft_size / 2 + 1;
}

// ============================================================================
// AUDIO FINGERPRINTING
// ============================================================================

/**
 * Compute audio fingerprint hash
 * Uses spectral peak picking similar to Shazam algorithm
 */
extern "C" EMSCRIPTEN_KEEPALIVE
uint32_t compute_audio_fingerprint(float* spectrogram, int num_frames, int num_bins) {
    if (!spectrogram || num_frames < 1 || num_bins < 1) return 0;
    
    uint32_t fingerprint = 0;
    
    // Find peaks in each frequency band and encode
    int bands[] = {0, 10, 20, 40, 80, 160, 320};
    int num_bands = 6;
    
    for (int frame = 0; frame < num_frames && frame < 32; frame++) {
        for (int band = 0; band < num_bands && band < 5; band++) {
            int start = bands[band];
            int end = (bands[band + 1] < num_bins) ? bands[band + 1] : num_bins;
            
            float max_val = -1000.0f;
            for (int i = start; i < end; i++) {
                if (spectrogram[frame * num_bins + i] > max_val) {
                    max_val = spectrogram[frame * num_bins + i];
                }
            }
            
            // Encode peak presence as bits
            if (max_val > -30.0f) { // Threshold in dB
                fingerprint |= (1 << ((frame % 8) * 4 + band));
            }
        }
    }
    
    return fingerprint;
}

/**
 * Match intro fingerprint against database
 * Returns index of best match or -1 if no match
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int match_intro_fingerprint(float* spectrogram, float* intro_db, int db_size) {
    if (!spectrogram || !intro_db || db_size < 1) return -1;
    
    // Compute fingerprint of input
    uint32_t input_fp = compute_audio_fingerprint(spectrogram, 32, 128);
    
    int best_match = -1;
    int best_score = 0;
    
    // Compare against database entries (each entry is 32 frames x 128 bins)
    for (int i = 0; i < db_size; i++) {
        uint32_t db_fp = compute_audio_fingerprint(intro_db + i * 32 * 128, 32, 128);
        
        // Count matching bits (Hamming similarity)
        uint32_t xor_result = ~(input_fp ^ db_fp);
        int matches = 0;
        while (xor_result) {
            matches += xor_result & 1;
            xor_result >>= 1;
        }
        
        if (matches > best_score && matches > 20) { // Threshold
            best_score = matches;
            best_match = i;
        }
    }
    
    return best_match;
}

// ============================================================================
// AUDIO PEAK DETECTION
// ============================================================================

/**
 * Detect peaks in audio signal for onset detection
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* detect_audio_peaks(float* audio_data, int length, float threshold) {
    if (!audio_data || length < 3) return nullptr;
    
    // Count peaks first
    int peak_count = 0;
    for (int i = 1; i < length - 1; i++) {
        if (audio_data[i] > threshold &&
            audio_data[i] > audio_data[i-1] &&
            audio_data[i] > audio_data[i+1]) {
            peak_count++;
        }
    }
    
    // Allocate result array: [count, idx1, val1, idx2, val2, ...]
    float* peaks = (float*)malloc((1 + peak_count * 2) * sizeof(float));
    if (!peaks) return nullptr;
    
    peaks[0] = (float)peak_count;
    int j = 1;
    
    for (int i = 1; i < length - 1; i++) {
        if (audio_data[i] > threshold &&
            audio_data[i] > audio_data[i-1] &&
            audio_data[i] > audio_data[i+1]) {
            peaks[j++] = (float)i;
            peaks[j++] = audio_data[i];
        }
    }
    
    return peaks;
}

/**
 * Detect intro boundaries using audio analysis
 * Returns [intro_start_frame, intro_end_frame]
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* detect_intro_boundaries(float* audio_samples, int sample_count, int sample_rate) {
    if (!audio_samples || sample_count < sample_rate * 5) return nullptr;
    
    float* result = (float*)malloc(4 * sizeof(float));
    if (!result) return nullptr;
    
    int window_size = sample_rate / 10; // 100ms windows
    int num_windows = sample_count / window_size;
    
    // Calculate energy for each window
    float* energy = (float*)malloc(num_windows * sizeof(float));
    if (!energy) { free(result); return nullptr; }
    
    for (int w = 0; w < num_windows; w++) {
        float sum = 0.0f;
        for (int i = 0; i < window_size; i++) {
            float val = audio_samples[w * window_size + i];
            sum += val * val;
        }
        energy[w] = sqrtf(sum / window_size);
    }
    
    // Find sudden energy changes (intro typically starts/ends with fade/cut)
    float avg_energy = 0.0f;
    for (int w = 0; w < num_windows; w++) avg_energy += energy[w];
    avg_energy /= num_windows;
    
    // Look for intro start (first significant energy after silence)
    int intro_start = 0;
    for (int w = 1; w < num_windows / 4; w++) { // First 25% of video
        if (energy[w] > avg_energy * 0.5f && energy[w-1] < avg_energy * 0.2f) {
            intro_start = w;
            break;
        }
    }
    
    // Look for intro end (energy pattern change)
    int intro_end = intro_start + 100; // Default ~10 seconds
    float intro_avg = 0.0f;
    for (int w = intro_start; w < intro_start + 50 && w < num_windows; w++) {
        intro_avg += energy[w];
    }
    intro_avg /= 50;
    
    for (int w = intro_start + 50; w < num_windows / 3; w++) {
        float local_avg = 0.0f;
        for (int i = 0; i < 10 && w + i < num_windows; i++) {
            local_avg += energy[w + i];
        }
        local_avg /= 10;
        
        if (fabsf(local_avg - intro_avg) > intro_avg * 0.5f) {
            intro_end = w;
            break;
        }
    }
    
    result[0] = (float)intro_start * window_size / sample_rate; // Start time in seconds
    result[1] = (float)intro_end * window_size / sample_rate;   // End time in seconds
    result[2] = intro_avg; // Intro energy (confidence indicator)
    result[3] = (float)(intro_end - intro_start) / 10.0f; // Duration in seconds
    
    free(energy);
    return result;
}

// ============================================================================
// AUDIO SIMILARITY
// ============================================================================

/**
 * Calculate similarity between two audio segments
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float calculate_audio_similarity(float* audio1, float* audio2, int length) {
    if (!audio1 || !audio2 || length < 1) return 0.0f;
    
    float dot_product = 0.0f;
    float norm1 = 0.0f, norm2 = 0.0f;
    
    for (int i = 0; i < length; i++) {
        dot_product += audio1[i] * audio2[i];
        norm1 += audio1[i] * audio1[i];
        norm2 += audio2[i] * audio2[i];
    }
    
    if (norm1 == 0 || norm2 == 0) return 0.0f;
    return dot_product / (sqrtf(norm1) * sqrtf(norm2));
}

// Memory management
extern "C" EMSCRIPTEN_KEEPALIVE
void* wasm_malloc(int size) { return malloc(size); }

extern "C" EMSCRIPTEN_KEEPALIVE
void wasm_free(void* ptr) { free(ptr); }

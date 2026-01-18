/**
 * Video Hashing WebAssembly Module
 * Perceptual hashing for video duplicate detection and content matching
 */

#include <emscripten.h>
#include <cmath>
#include <cstring>
#include <cstdint>
#include <cstdlib>

// ============================================================================
// PERCEPTUAL HASHING (pHash)
// ============================================================================

/**
 * Compute DCT (Discrete Cosine Transform) for an 8x8 block
 */
static void compute_dct_8x8(float* input, float* output) {
    const float PI = 3.14159265358979323846f;
    
    for (int u = 0; u < 8; u++) {
        for (int v = 0; v < 8; v++) {
            float sum = 0.0f;
            float cu = (u == 0) ? 1.0f / sqrtf(2.0f) : 1.0f;
            float cv = (v == 0) ? 1.0f / sqrtf(2.0f) : 1.0f;
            
            for (int x = 0; x < 8; x++) {
                for (int y = 0; y < 8; y++) {
                    sum += input[x * 8 + y] * 
                           cosf((2.0f * x + 1.0f) * u * PI / 16.0f) *
                           cosf((2.0f * y + 1.0f) * v * PI / 16.0f);
                }
            }
            
            output[u * 8 + v] = 0.25f * cu * cv * sum;
        }
    }
}

/**
 * Resize image to 32x32 using bilinear interpolation
 */
static void resize_to_32x32(uint8_t* input, int width, int height, float* output) {
    float x_ratio = (float)(width - 1) / 31.0f;
    float y_ratio = (float)(height - 1) / 31.0f;
    
    for (int y = 0; y < 32; y++) {
        for (int x = 0; x < 32; x++) {
            float gx = x * x_ratio;
            float gy = y * y_ratio;
            int gxi = (int)gx;
            int gyi = (int)gy;
            float dx = gx - gxi;
            float dy = gy - gyi;
            
            int idx00 = (gyi * width + gxi) * 3;
            int idx01 = (gyi * width + gxi + 1) * 3;
            int idx10 = ((gyi + 1) * width + gxi) * 3;
            int idx11 = ((gyi + 1) * width + gxi + 1) * 3;
            
            // Convert to grayscale and interpolate
            float v00 = 0.299f * input[idx00] + 0.587f * input[idx00+1] + 0.114f * input[idx00+2];
            float v01 = 0.299f * input[idx01] + 0.587f * input[idx01+1] + 0.114f * input[idx01+2];
            float v10 = 0.299f * input[idx10] + 0.587f * input[idx10+1] + 0.114f * input[idx10+2];
            float v11 = 0.299f * input[idx11] + 0.587f * input[idx11+1] + 0.114f * input[idx11+2];
            
            output[y * 32 + x] = v00 * (1-dx) * (1-dy) + v01 * dx * (1-dy) +
                                 v10 * (1-dx) * dy + v11 * dx * dy;
        }
    }
}

/**
 * Compute perceptual hash (pHash) for a frame
 * Returns 64-bit hash value
 */
extern "C" EMSCRIPTEN_KEEPALIVE
uint64_t compute_phash(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width < 32 || height < 32) return 0;
    
    // Step 1: Resize to 32x32
    float* small = (float*)malloc(32 * 32 * sizeof(float));
    if (!small) return 0;
    
    resize_to_32x32(frame_data, width, height, small);
    
    // Step 2: Compute DCT
    float* dct = (float*)malloc(32 * 32 * sizeof(float));
    if (!dct) { free(small); return 0; }
    
    // Compute DCT for 8x8 top-left block (most significant)
    float dct_block[64];
    float input_block[64];
    
    for (int i = 0; i < 8; i++) {
        for (int j = 0; j < 8; j++) {
            input_block[i * 8 + j] = small[i * 32 + j];
        }
    }
    
    compute_dct_8x8(input_block, dct_block);
    
    // Step 3: Calculate mean of DCT coefficients (excluding DC)
    float mean = 0.0f;
    for (int i = 1; i < 64; i++) {
        mean += dct_block[i];
    }
    mean /= 63.0f;
    
    // Step 4: Generate hash based on whether each coefficient > mean
    uint64_t hash = 0;
    for (int i = 1; i < 64; i++) {
        if (dct_block[i] > mean) {
            hash |= (1ULL << (i - 1));
        }
    }
    
    free(small);
    free(dct);
    
    return hash;
}

/**
 * Compute average hash (aHash) - simpler but less robust
 */
extern "C" EMSCRIPTEN_KEEPALIVE
uint64_t compute_ahash(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width < 8 || height < 8) return 0;
    
    // Resize to 8x8
    float x_ratio = (float)(width - 1) / 7.0f;
    float y_ratio = (float)(height - 1) / 7.0f;
    float small[64];
    
    for (int y = 0; y < 8; y++) {
        for (int x = 0; x < 8; x++) {
            int gx = (int)(x * x_ratio);
            int gy = (int)(y * y_ratio);
            int idx = (gy * width + gx) * 3;
            small[y * 8 + x] = 0.299f * frame_data[idx] + 
                               0.587f * frame_data[idx+1] + 
                               0.114f * frame_data[idx+2];
        }
    }
    
    // Calculate mean
    float mean = 0.0f;
    for (int i = 0; i < 64; i++) mean += small[i];
    mean /= 64.0f;
    
    // Generate hash
    uint64_t hash = 0;
    for (int i = 0; i < 64; i++) {
        if (small[i] > mean) hash |= (1ULL << i);
    }
    
    return hash;
}

/**
 * Compute difference hash (dHash) - good for similar image detection
 */
extern "C" EMSCRIPTEN_KEEPALIVE
uint64_t compute_dhash(uint8_t* frame_data, int width, int height) {
    if (!frame_data || width < 9 || height < 8) return 0;
    
    // Resize to 9x8 (9 columns for 8 horizontal differences)
    float x_ratio = (float)(width - 1) / 8.0f;
    float y_ratio = (float)(height - 1) / 7.0f;
    float small[72];
    
    for (int y = 0; y < 8; y++) {
        for (int x = 0; x < 9; x++) {
            int gx = (int)(x * x_ratio);
            int gy = (int)(y * y_ratio);
            int idx = (gy * width + gx) * 3;
            small[y * 9 + x] = 0.299f * frame_data[idx] + 
                               0.587f * frame_data[idx+1] + 
                               0.114f * frame_data[idx+2];
        }
    }
    
    // Generate hash based on horizontal gradients
    uint64_t hash = 0;
    int bit = 0;
    for (int y = 0; y < 8; y++) {
        for (int x = 0; x < 8; x++) {
            if (small[y * 9 + x] < small[y * 9 + x + 1]) {
                hash |= (1ULL << bit);
            }
            bit++;
        }
    }
    
    return hash;
}

// ============================================================================
// HASH COMPARISON
// ============================================================================

/**
 * Calculate Hamming distance between two hashes
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int calculate_hamming_distance(uint64_t hash1, uint64_t hash2) {
    uint64_t xor_result = hash1 ^ hash2;
    int distance = 0;
    
    while (xor_result) {
        distance += xor_result & 1;
        xor_result >>= 1;
    }
    
    return distance;
}

/**
 * Compare two video hashes and return similarity score (0.0 - 1.0)
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float compare_video_hashes(uint64_t* hashes1, uint64_t* hashes2, int count) {
    if (!hashes1 || !hashes2 || count < 1) return 0.0f;
    
    int total_distance = 0;
    
    for (int i = 0; i < count; i++) {
        total_distance += calculate_hamming_distance(hashes1[i], hashes2[i]);
    }
    
    // Max possible distance per hash is 64
    float max_distance = 64.0f * count;
    float similarity = 1.0f - (total_distance / max_distance);
    
    return similarity;
}

/**
 * Detect if content is duplicate of any in database
 * Returns index of match or -1 if no match found
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int detect_duplicate_content(uint64_t* new_hashes, int hash_count, 
                             uint64_t* database, int db_entries, int hashes_per_entry,
                             float threshold) {
    if (!new_hashes || !database || hash_count < 1) return -1;
    
    int compare_count = (hash_count < hashes_per_entry) ? hash_count : hashes_per_entry;
    
    for (int entry = 0; entry < db_entries; entry++) {
        uint64_t* db_hashes = database + entry * hashes_per_entry;
        float similarity = compare_video_hashes(new_hashes, db_hashes, compare_count);
        
        if (similarity >= threshold) {
            return entry;
        }
    }
    
    return -1;
}

/**
 * Find similar videos in database
 * Returns array of [entry_index, similarity_score] pairs
 */
extern "C" EMSCRIPTEN_KEEPALIVE
float* find_similar_videos(uint64_t* query_hashes, int hash_count,
                           uint64_t* database, int db_entries, int hashes_per_entry,
                           float min_similarity, int max_results) {
    if (!query_hashes || !database || hash_count < 1) return nullptr;
    
    // Allocate result array: [count, idx1, sim1, idx2, sim2, ...]
    float* results = (float*)malloc((1 + max_results * 2) * sizeof(float));
    if (!results) return nullptr;
    
    int compare_count = (hash_count < hashes_per_entry) ? hash_count : hashes_per_entry;
    int found = 0;
    
    // Simple approach: scan all entries
    // For production, use LSH (Locality-Sensitive Hashing) for efficiency
    for (int entry = 0; entry < db_entries && found < max_results; entry++) {
        uint64_t* db_hashes = database + entry * hashes_per_entry;
        float similarity = compare_video_hashes(query_hashes, db_hashes, compare_count);
        
        if (similarity >= min_similarity) {
            results[1 + found * 2] = (float)entry;
            results[1 + found * 2 + 1] = similarity;
            found++;
        }
    }
    
    results[0] = (float)found;
    return results;
}

// ============================================================================
// VIDEO FINGERPRINTING
// ============================================================================

/**
 * Compute video fingerprint from multiple frames
 * Returns array of hashes for the video
 */
extern "C" EMSCRIPTEN_KEEPALIVE
uint64_t* compute_video_fingerprint(uint8_t* frames_data, int frame_count, 
                                    int width, int height, int sample_interval) {
    if (!frames_data || frame_count < 1) return nullptr;
    
    int sampled_count = (frame_count + sample_interval - 1) / sample_interval;
    uint64_t* fingerprint = (uint64_t*)malloc(sampled_count * sizeof(uint64_t));
    if (!fingerprint) return nullptr;
    
    int frame_size = width * height * 3;
    int hash_idx = 0;
    
    for (int i = 0; i < frame_count && hash_idx < sampled_count; i += sample_interval) {
        uint8_t* frame = frames_data + i * frame_size;
        fingerprint[hash_idx++] = compute_phash(frame, width, height);
    }
    
    return fingerprint;
}

/**
 * Get fingerprint length
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int get_fingerprint_length(int frame_count, int sample_interval) {
    return (frame_count + sample_interval - 1) / sample_interval;
}

// ============================================================================
// SCENE MATCHING
// ============================================================================

/**
 * Find matching scene in target video
 * Returns frame offset where match starts, or -1 if not found
 */
extern "C" EMSCRIPTEN_KEEPALIVE
int find_matching_scene(uint64_t* query_hashes, int query_length,
                        uint64_t* target_hashes, int target_length,
                        int min_match_length, float similarity_threshold) {
    if (!query_hashes || !target_hashes || query_length < 1) return -1;
    
    int match_length = (min_match_length < query_length) ? min_match_length : query_length;
    
    for (int offset = 0; offset <= target_length - match_length; offset++) {
        float similarity = compare_video_hashes(query_hashes, 
                                                target_hashes + offset, 
                                                match_length);
        if (similarity >= similarity_threshold) {
            return offset;
        }
    }
    
    return -1;
}

// Memory management
extern "C" EMSCRIPTEN_KEEPALIVE
void* wasm_malloc(int size) { return malloc(size); }

extern "C" EMSCRIPTEN_KEEPALIVE
void wasm_free(void* ptr) { free(ptr); }

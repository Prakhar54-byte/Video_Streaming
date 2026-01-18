#!/bin/bash
# Build all WASM modules for Video Streaming Platform
# Requires: Emscripten SDK (emcc)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CPP_DIR="$SCRIPT_DIR"
WASM_OUTPUT_DIR="$SCRIPT_DIR/../lib/wasm"
JS_OUTPUT_DIR="$SCRIPT_DIR/../lib/wasm-js"

# Create output directories
mkdir -p "$WASM_OUTPUT_DIR"
mkdir -p "$JS_OUTPUT_DIR"

echo "========================================"
echo "Building Video Streaming WASM Modules"
echo "========================================"
echo ""

# Common compilation flags
COMMON_FLAGS="-O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1"
EXPORT_FLAGS="-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','getValue','setValue']"

# ============================================================================
# 1. Frame Analyzer Module
# ============================================================================
echo "📹 Building Frame Analyzer..."
emcc "$CPP_DIR/frame_analyzer.cpp" \
    $COMMON_FLAGS \
    -s EXPORT_NAME='FrameAnalyzer' \
    -s EXPORTED_FUNCTIONS='[
        "_calculate_scene_change_score",
        "_detect_scene_changes",
        "_detect_black_frames",
        "_calculate_frame_brightness",
        "_calculate_motion_intensity",
        "_calculate_average_motion",
        "_calculate_sharpness",
        "_calculate_contrast",
        "_calculate_frame_quality",
        "_select_best_keyframe",
        "_select_representative_keyframes",
        "_wasm_malloc",
        "_wasm_free"
    ]' \
    $EXPORT_FLAGS \
    -o "$JS_OUTPUT_DIR/frame_analyzer.js"

# Also build standalone WASM for non-JS environments
emcc "$CPP_DIR/frame_analyzer.cpp" \
    -O3 -s WASM=1 -s STANDALONE_WASM=1 \
    -s EXPORTED_FUNCTIONS='["_calculate_scene_change_score","_detect_black_frames","_calculate_frame_quality","_select_best_keyframe","_wasm_malloc","_wasm_free"]' \
    -o "$WASM_OUTPUT_DIR/frame_analyzer.wasm"

echo "✅ Frame Analyzer built successfully"
echo ""

# ============================================================================
# 2. Audio Fingerprint Module
# ============================================================================
echo "🎵 Building Audio Fingerprint..."
emcc "$CPP_DIR/audio_fingerprint.cpp" \
    $COMMON_FLAGS \
    -s EXPORT_NAME='AudioFingerprint' \
    -s EXPORTED_FUNCTIONS='[
        "_compute_audio_spectrogram",
        "_get_spectrogram_frames",
        "_get_spectrogram_bins",
        "_compute_audio_fingerprint",
        "_match_intro_fingerprint",
        "_detect_audio_peaks",
        "_detect_intro_boundaries",
        "_calculate_audio_similarity",
        "_wasm_malloc",
        "_wasm_free"
    ]' \
    $EXPORT_FLAGS \
    -o "$JS_OUTPUT_DIR/audio_fingerprint.js"

emcc "$CPP_DIR/audio_fingerprint.cpp" \
    -O3 -s WASM=1 -s STANDALONE_WASM=1 \
    -s EXPORTED_FUNCTIONS='["_compute_audio_spectrogram","_detect_intro_boundaries","_match_intro_fingerprint","_wasm_malloc","_wasm_free"]' \
    -o "$WASM_OUTPUT_DIR/audio_fingerprint.wasm"

echo "✅ Audio Fingerprint built successfully"
echo ""

# ============================================================================
# 3. ABR Controller Module
# ============================================================================
echo "📊 Building ABR Controller..."
emcc "$CPP_DIR/abr_controller.cpp" \
    $COMMON_FLAGS \
    -s EXPORT_NAME='ABRController' \
    -s EXPORTED_FUNCTIONS='[
        "_predict_bandwidth",
        "_predict_bandwidth_harmonic",
        "_detect_bandwidth_trend",
        "_select_quality_level",
        "_select_quality_stable",
        "_calculate_buffer_health",
        "_calculate_rebuffer_probability",
        "_estimate_qoe",
        "_select_quality_maximize_qoe",
        "_calculate_bandwidth_variance",
        "_get_comprehensive_recommendation",
        "_wasm_malloc",
        "_wasm_free"
    ]' \
    $EXPORT_FLAGS \
    -o "$JS_OUTPUT_DIR/abr_controller.js"

emcc "$CPP_DIR/abr_controller.cpp" \
    -O3 -s WASM=1 -s STANDALONE_WASM=1 \
    -s EXPORTED_FUNCTIONS='["_select_quality_level","_predict_bandwidth","_calculate_buffer_health","_get_comprehensive_recommendation","_wasm_malloc","_wasm_free"]' \
    -o "$WASM_OUTPUT_DIR/abr_controller.wasm"

echo "✅ ABR Controller built successfully"
echo ""

# ============================================================================
# 4. Video Hash Module
# ============================================================================
echo "🔐 Building Video Hash..."
emcc "$CPP_DIR/video_hash.cpp" \
    $COMMON_FLAGS \
    -s EXPORT_NAME='VideoHash' \
    -s EXPORTED_FUNCTIONS='[
        "_compute_phash",
        "_compute_ahash",
        "_compute_dhash",
        "_calculate_hamming_distance",
        "_compare_video_hashes",
        "_detect_duplicate_content",
        "_find_similar_videos",
        "_compute_video_fingerprint",
        "_get_fingerprint_length",
        "_find_matching_scene",
        "_wasm_malloc",
        "_wasm_free"
    ]' \
    $EXPORT_FLAGS \
    -o "$JS_OUTPUT_DIR/video_hash.js"

emcc "$CPP_DIR/video_hash.cpp" \
    -O3 -s WASM=1 -s STANDALONE_WASM=1 \
    -s EXPORTED_FUNCTIONS='["_compute_phash","_compare_video_hashes","_detect_duplicate_content","_wasm_malloc","_wasm_free"]' \
    -o "$WASM_OUTPUT_DIR/video_hash.wasm"

echo "✅ Video Hash built successfully"
echo ""

# ============================================================================
# 5. Color Analyzer Module
# ============================================================================
echo "🎨 Building Color Analyzer..."
emcc "$CPP_DIR/color_analyzer.cpp" \
    $COMMON_FLAGS \
    -s EXPORT_NAME='ColorAnalyzer' \
    -s EXPORTED_FUNCTIONS='[
        "_calculate_color_histogram",
        "_calculate_hsv_histogram",
        "_calculate_colorfulness_score",
        "_calculate_dominant_color",
        "_extract_color_palette",
        "_calculate_thumbnail_score",
        "_select_best_thumbnail_frame",
        "_select_best_thumbnail_from_histograms",
        "_calculate_color_distance",
        "_compare_color_histograms",
        "_wasm_malloc",
        "_wasm_free"
    ]' \
    $EXPORT_FLAGS \
    -o "$JS_OUTPUT_DIR/color_analyzer.js"

emcc "$CPP_DIR/color_analyzer.cpp" \
    -O3 -s WASM=1 -s STANDALONE_WASM=1 \
    -s EXPORTED_FUNCTIONS='["_calculate_colorfulness_score","_select_best_thumbnail_frame","_extract_color_palette","_wasm_malloc","_wasm_free"]' \
    -o "$WASM_OUTPUT_DIR/color_analyzer.wasm"

echo "✅ Color Analyzer built successfully"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "========================================"
echo "Build Complete!"
echo "========================================"
echo ""
echo "Standalone WASM files (for Node.js/Python):"
ls -la "$WASM_OUTPUT_DIR"/*.wasm
echo ""
echo "JS+WASM bundles (for browser/frontend):"
ls -la "$JS_OUTPUT_DIR"/*.js
echo ""
echo "Next steps:"
echo "1. Copy JS bundles to frontend/public/wasm/"
echo "2. Import WASM modules in your services"
echo ""

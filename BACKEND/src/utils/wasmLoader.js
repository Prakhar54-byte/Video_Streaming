/**
 * WASM Module Loader for Node.js Backend
 * Provides unified interface for loading and using all WASM modules
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WASM directory path
const WASM_DIR = path.join(__dirname, '../lib/wasm');

/**
 * Generic WASM module loader
 */
class WasmModule {
    constructor(name) {
        this.name = name;
        this.instance = null;
        this.memory = null;
        this.exports = null;
        this.loaded = false;
    }

    async load() {
        if (this.loaded) return this;

        try {
            const wasmPath = path.join(WASM_DIR, `${this.name}.wasm`);
            const wasmBuffer = await readFile(wasmPath);
            
            const wasmModule = await WebAssembly.compile(wasmBuffer);
            this.instance = await WebAssembly.instantiate(wasmModule, {
                env: {
                    memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
                    __memory_base: 0,
                    __table_base: 0,
                },
                wasi_snapshot_preview1: {
                    proc_exit: () => {},
                    fd_write: () => 0,
                    fd_close: () => 0,
                    fd_seek: () => 0,
                }
            });

            this.exports = this.instance.exports;
            this.memory = this.exports.memory;
            this.loaded = true;
            
            console.log(`✅ WASM module '${this.name}' loaded successfully`);
            return this;
        } catch (error) {
            console.error(`❌ Failed to load WASM module '${this.name}':`, error.message);
            throw error;
        }
    }

    /**
     * Allocate memory in WASM
     */
    malloc(size) {
        if (!this.exports.wasm_malloc) {
            throw new Error(`Module ${this.name} does not export wasm_malloc`);
        }
        return this.exports.wasm_malloc(size);
    }

    /**
     * Free memory in WASM
     */
    free(ptr) {
        if (!this.exports.wasm_free) {
            throw new Error(`Module ${this.name} does not export wasm_free`);
        }
        this.exports.wasm_free(ptr);
    }

    /**
     * Write typed array to WASM memory
     */
    writeArray(ptr, array, type = 'Uint8') {
        const view = this.getMemoryView(type);
        view.set(array, ptr / this.getTypeSize(type));
    }

    /**
     * Read typed array from WASM memory
     */
    readArray(ptr, length, type = 'Uint8') {
        const view = this.getMemoryView(type);
        const typeSize = this.getTypeSize(type);
        return Array.from(view.slice(ptr / typeSize, ptr / typeSize + length));
    }

    /**
     * Get memory view based on type
     */
    getMemoryView(type) {
        const buffer = this.memory.buffer;
        switch (type) {
            case 'Uint8': return new Uint8Array(buffer);
            case 'Int32': return new Int32Array(buffer);
            case 'Float32': return new Float32Array(buffer);
            case 'Float64': return new Float64Array(buffer);
            case 'Uint64': return new BigUint64Array(buffer);
            default: return new Uint8Array(buffer);
        }
    }

    /**
     * Get byte size for type
     */
    getTypeSize(type) {
        switch (type) {
            case 'Uint8': return 1;
            case 'Int32': return 4;
            case 'Float32': return 4;
            case 'Float64': return 8;
            case 'Uint64': return 8;
            default: return 1;
        }
    }
}

// ============================================================================
// FRAME ANALYZER MODULE
// ============================================================================

class FrameAnalyzerModule extends WasmModule {
    constructor() {
        super('frame_analyzer');
    }

    /**
     * Calculate scene change score between two frames
     * @param {Uint8Array} prevFrame - Previous frame RGB data
     * @param {Uint8Array} currFrame - Current frame RGB data
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @returns {number} Scene change score (0.0 - 1.0)
     */
    calculateSceneChangeScore(prevFrame, currFrame, width, height) {
        const frameSize = width * height * 3;
        const prevPtr = this.malloc(frameSize);
        const currPtr = this.malloc(frameSize);

        try {
            this.writeArray(prevPtr, prevFrame, 'Uint8');
            this.writeArray(currPtr, currFrame, 'Uint8');
            
            return this.exports.calculate_scene_change_score(prevPtr, currPtr, width, height);
        } finally {
            this.free(prevPtr);
            this.free(currPtr);
        }
    }

    /**
     * Detect black frames
     * @param {Uint8Array} frameData - Frame RGB data
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @param {number} threshold - Brightness threshold (0-255)
     * @returns {boolean} True if black frame
     */
    detectBlackFrame(frameData, width, height, threshold = 20) {
        const frameSize = width * height * 3;
        const ptr = this.malloc(frameSize);

        try {
            this.writeArray(ptr, frameData, 'Uint8');
            return this.exports.detect_black_frames(ptr, width, height, threshold) === 1;
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Calculate frame quality score
     * @param {Uint8Array} frameData - Frame RGB data
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @returns {number} Quality score (0-100)
     */
    calculateFrameQuality(frameData, width, height) {
        const frameSize = width * height * 3;
        const ptr = this.malloc(frameSize);

        try {
            this.writeArray(ptr, frameData, 'Uint8');
            return this.exports.calculate_frame_quality(ptr, width, height);
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Select best keyframe from multiple frames
     * @param {Uint8Array} framesData - All frames data (concatenated)
     * @param {number} frameCount - Number of frames
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @returns {number} Index of best frame
     */
    selectBestKeyframe(framesData, frameCount, width, height) {
        const totalSize = frameCount * width * height * 3;
        const ptr = this.malloc(totalSize);

        try {
            this.writeArray(ptr, framesData, 'Uint8');
            return this.exports.select_best_keyframe(ptr, frameCount, width, height);
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Calculate motion intensity between frames
     */
    calculateMotionIntensity(prevFrame, currFrame, width, height) {
        const frameSize = width * height * 3;
        const prevPtr = this.malloc(frameSize);
        const currPtr = this.malloc(frameSize);

        try {
            this.writeArray(prevPtr, prevFrame, 'Uint8');
            this.writeArray(currPtr, currFrame, 'Uint8');
            return this.exports.calculate_motion_intensity(prevPtr, currPtr, width, height);
        } finally {
            this.free(prevPtr);
            this.free(currPtr);
        }
    }
}

// ============================================================================
// AUDIO FINGERPRINT MODULE
// ============================================================================

class AudioFingerprintModule extends WasmModule {
    constructor() {
        super('audio_fingerprint');
    }

    /**
     * Detect intro boundaries in audio
     * @param {Float32Array} audioSamples - Audio samples
     * @param {number} sampleRate - Sample rate (e.g., 44100)
     * @returns {Object} { introStart, introEnd, confidence, duration }
     */
    detectIntroBoundaries(audioSamples, sampleRate) {
        const sampleCount = audioSamples.length;
        const ptr = this.malloc(sampleCount * 4); // Float32 = 4 bytes

        try {
            const view = new Float32Array(this.memory.buffer);
            view.set(audioSamples, ptr / 4);
            
            const resultPtr = this.exports.detect_intro_boundaries(ptr, sampleCount, sampleRate);
            
            if (resultPtr === 0) return null;

            const result = this.readArray(resultPtr, 4, 'Float32');
            this.free(resultPtr);

            return {
                introStart: result[0],
                introEnd: result[1],
                confidence: result[2],
                duration: result[3]
            };
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Compute audio spectrogram
     * @param {Float32Array} audioSamples - Audio samples
     * @param {number} fftSize - FFT size (e.g., 2048)
     * @returns {Object} { data, frames, bins }
     */
    computeSpectrogram(audioSamples, fftSize = 2048) {
        const sampleCount = audioSamples.length;
        const ptr = this.malloc(sampleCount * 4);

        try {
            const view = new Float32Array(this.memory.buffer);
            view.set(audioSamples, ptr / 4);
            
            const frames = this.exports.get_spectrogram_frames(sampleCount, fftSize);
            const bins = this.exports.get_spectrogram_bins(fftSize);
            
            const resultPtr = this.exports.compute_audio_spectrogram(ptr, sampleCount, fftSize);
            
            if (resultPtr === 0) return null;

            const data = this.readArray(resultPtr, frames * bins, 'Float32');
            this.free(resultPtr);

            return { data, frames, bins };
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Calculate audio similarity between two segments
     */
    calculateAudioSimilarity(audio1, audio2) {
        const length = Math.min(audio1.length, audio2.length);
        const ptr1 = this.malloc(length * 4);
        const ptr2 = this.malloc(length * 4);

        try {
            const view = new Float32Array(this.memory.buffer);
            view.set(audio1.slice(0, length), ptr1 / 4);
            view.set(audio2.slice(0, length), ptr2 / 4);
            
            return this.exports.calculate_audio_similarity(ptr1, ptr2, length);
        } finally {
            this.free(ptr1);
            this.free(ptr2);
        }
    }
}

// ============================================================================
// ABR CONTROLLER MODULE
// ============================================================================

class ABRControllerModule extends WasmModule {
    constructor() {
        super('abr_controller');
    }

    /**
     * Predict bandwidth from history
     * @param {number[]} bandwidthHistory - Array of bandwidth measurements (kbps)
     * @returns {number} Predicted bandwidth (kbps)
     */
    predictBandwidth(bandwidthHistory) {
        const length = bandwidthHistory.length;
        const ptr = this.malloc(length * 4);

        try {
            const view = new Float32Array(this.memory.buffer);
            view.set(bandwidthHistory, ptr / 4);
            
            return this.exports.predict_bandwidth(ptr, length);
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Select optimal quality level
     * @param {number} bandwidth - Available bandwidth (kbps)
     * @param {number} bufferLevel - Current buffer level (seconds)
     * @param {number} currentQuality - Current quality level (0-5)
     * @param {number} maxQuality - Maximum quality level available
     * @returns {number} Recommended quality level
     */
    selectQualityLevel(bandwidth, bufferLevel, currentQuality, maxQuality) {
        return this.exports.select_quality_level(bandwidth, bufferLevel, currentQuality, maxQuality);
    }

    /**
     * Calculate buffer health score
     * @param {number} bufferSeconds - Current buffer in seconds
     * @param {number} segmentDuration - Segment duration in seconds
     * @returns {number} Buffer health (0.0 - 1.0)
     */
    calculateBufferHealth(bufferSeconds, segmentDuration) {
        return this.exports.calculate_buffer_health(bufferSeconds, segmentDuration);
    }

    /**
     * Get comprehensive ABR recommendation
     * @param {number[]} bandwidthHistory - Bandwidth history
     * @param {number} bufferSeconds - Current buffer
     * @param {number} segmentDuration - Segment duration
     * @param {number} currentQuality - Current quality
     * @param {number} maxQuality - Max quality
     * @returns {Object} { quality, confidence, rebufferRisk, estimatedQoE }
     */
    getRecommendation(bandwidthHistory, bufferSeconds, segmentDuration, currentQuality, maxQuality) {
        const length = bandwidthHistory.length;
        const ptr = this.malloc(length * 4);

        try {
            const view = new Float32Array(this.memory.buffer);
            view.set(bandwidthHistory, ptr / 4);
            
            const resultPtr = this.exports.get_comprehensive_recommendation(
                ptr, length, bufferSeconds, segmentDuration, currentQuality, maxQuality
            );
            
            if (resultPtr === 0) return null;

            const result = this.readArray(resultPtr, 4, 'Float32');
            this.free(resultPtr);

            return {
                quality: Math.round(result[0]),
                confidence: result[1],
                rebufferRisk: result[2],
                estimatedQoE: result[3]
            };
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Detect bandwidth trend
     * @param {number[]} history - Bandwidth history
     * @returns {number} 1 = increasing, 0 = stable, -1 = decreasing
     */
    detectBandwidthTrend(history) {
        const length = history.length;
        const ptr = this.malloc(length * 4);

        try {
            const view = new Float32Array(this.memory.buffer);
            view.set(history, ptr / 4);
            
            return this.exports.detect_bandwidth_trend(ptr, length);
        } finally {
            this.free(ptr);
        }
    }
}

// ============================================================================
// VIDEO HASH MODULE
// ============================================================================

class VideoHashModule extends WasmModule {
    constructor() {
        super('video_hash');
    }

    /**
     * Compute perceptual hash for a frame
     * @param {Uint8Array} frameData - Frame RGB data
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @returns {BigInt} 64-bit perceptual hash
     */
    computePHash(frameData, width, height) {
        const frameSize = width * height * 3;
        const ptr = this.malloc(frameSize);

        try {
            this.writeArray(ptr, frameData, 'Uint8');
            return this.exports.compute_phash(ptr, width, height);
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Calculate Hamming distance between two hashes
     */
    calculateHammingDistance(hash1, hash2) {
        return this.exports.calculate_hamming_distance(hash1, hash2);
    }

    /**
     * Compare two videos by their hashes
     * @param {BigInt[]} hashes1 - First video's frame hashes
     * @param {BigInt[]} hashes2 - Second video's frame hashes
     * @returns {number} Similarity score (0.0 - 1.0)
     */
    compareVideoHashes(hashes1, hashes2) {
        const count = Math.min(hashes1.length, hashes2.length);
        const ptr1 = this.malloc(count * 8);
        const ptr2 = this.malloc(count * 8);

        try {
            const view = new BigUint64Array(this.memory.buffer);
            for (let i = 0; i < count; i++) {
                view[ptr1 / 8 + i] = BigInt(hashes1[i]);
                view[ptr2 / 8 + i] = BigInt(hashes2[i]);
            }
            
            return this.exports.compare_video_hashes(ptr1, ptr2, count);
        } finally {
            this.free(ptr1);
            this.free(ptr2);
        }
    }

    /**
     * Detect duplicate content in database
     * @param {BigInt[]} newHashes - New video's hashes
     * @param {BigInt[][]} database - Database of video hashes
     * @param {number} threshold - Similarity threshold (0.0 - 1.0)
     * @returns {number} Index of matching video or -1
     */
    detectDuplicate(newHashes, database, threshold = 0.85) {
        // Simplified implementation - would need proper database structure
        for (let i = 0; i < database.length; i++) {
            const similarity = this.compareVideoHashes(newHashes, database[i]);
            if (similarity >= threshold) {
                return i;
            }
        }
        return -1;
    }
}

// ============================================================================
// COLOR ANALYZER MODULE
// ============================================================================

class ColorAnalyzerModule extends WasmModule {
    constructor() {
        super('color_analyzer');
    }

    /**
     * Calculate colorfulness score
     * @param {Uint8Array} frameData - Frame RGB data
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @returns {number} Colorfulness score
     */
    calculateColorfulness(frameData, width, height) {
        const frameSize = width * height * 3;
        const ptr = this.malloc(frameSize);

        try {
            this.writeArray(ptr, frameData, 'Uint8');
            return this.exports.calculate_colorfulness_score(ptr, width, height);
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Calculate thumbnail score
     * @param {Uint8Array} frameData - Frame RGB data
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @returns {number} Thumbnail score (0-100)
     */
    calculateThumbnailScore(frameData, width, height) {
        const frameSize = width * height * 3;
        const ptr = this.malloc(frameSize);

        try {
            this.writeArray(ptr, frameData, 'Uint8');
            return this.exports.calculate_thumbnail_score(ptr, width, height);
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Select best thumbnail from frames
     * @param {Uint8Array} framesData - All frames data
     * @param {number} frameCount - Number of frames
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @returns {number} Index of best thumbnail frame
     */
    selectBestThumbnail(framesData, frameCount, width, height) {
        const totalSize = frameCount * width * height * 3;
        const ptr = this.malloc(totalSize);

        try {
            this.writeArray(ptr, framesData, 'Uint8');
            return this.exports.select_best_thumbnail_frame(ptr, frameCount, width, height);
        } finally {
            this.free(ptr);
        }
    }

    /**
     * Extract color palette from frame
     * @param {Uint8Array} frameData - Frame RGB data
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @param {number} numColors - Number of colors to extract
     * @returns {Array} Array of [r, g, b] colors
     */
    extractColorPalette(frameData, width, height, numColors = 5) {
        const frameSize = width * height * 3;
        const ptr = this.malloc(frameSize);

        try {
            this.writeArray(ptr, frameData, 'Uint8');
            const resultPtr = this.exports.extract_color_palette(ptr, width, height, numColors);
            
            if (resultPtr === 0) return null;

            const colors = [];
            const result = this.readArray(resultPtr, numColors * 3, 'Float32');
            
            for (let i = 0; i < numColors; i++) {
                colors.push([
                    Math.round(result[i * 3]),
                    Math.round(result[i * 3 + 1]),
                    Math.round(result[i * 3 + 2])
                ]);
            }
            
            this.free(resultPtr);
            return colors;
        } finally {
            this.free(ptr);
        }
    }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let frameAnalyzer = null;
let audioFingerprint = null;
let abrController = null;
let videoHash = null;
let colorAnalyzer = null;

/**
 * Get Frame Analyzer instance
 */
export async function getFrameAnalyzer() {
    if (!frameAnalyzer) {
        frameAnalyzer = new FrameAnalyzerModule();
        await frameAnalyzer.load();
    }
    return frameAnalyzer;
}

/**
 * Get Audio Fingerprint instance
 */
export async function getAudioFingerprint() {
    if (!audioFingerprint) {
        audioFingerprint = new AudioFingerprintModule();
        await audioFingerprint.load();
    }
    return audioFingerprint;
}

/**
 * Get ABR Controller instance
 */
export async function getABRController() {
    if (!abrController) {
        abrController = new ABRControllerModule();
        await abrController.load();
    }
    return abrController;
}

/**
 * Get Video Hash instance
 */
export async function getVideoHash() {
    if (!videoHash) {
        videoHash = new VideoHashModule();
        await videoHash.load();
    }
    return videoHash;
}

/**
 * Get Color Analyzer instance
 */
export async function getColorAnalyzer() {
    if (!colorAnalyzer) {
        colorAnalyzer = new ColorAnalyzerModule();
        await colorAnalyzer.load();
    }
    return colorAnalyzer;
}

/**
 * Initialize all WASM modules
 */
export async function initializeAllModules() {
    const results = await Promise.allSettled([
        getFrameAnalyzer(),
        getAudioFingerprint(),
        getABRController(),
        getVideoHash(),
        getColorAnalyzer()
    ]);

    const loaded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`WASM Modules: ${loaded} loaded, ${failed} failed`);
    
    return {
        frameAnalyzer: results[0].status === 'fulfilled' ? results[0].value : null,
        audioFingerprint: results[1].status === 'fulfilled' ? results[1].value : null,
        abrController: results[2].status === 'fulfilled' ? results[2].value : null,
        videoHash: results[3].status === 'fulfilled' ? results[3].value : null,
        colorAnalyzer: results[4].status === 'fulfilled' ? results[4].value : null,
    };
}

export default {
    getFrameAnalyzer,
    getAudioFingerprint,
    getABRController,
    getVideoHash,
    getColorAnalyzer,
    initializeAllModules
};

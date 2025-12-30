#!/bin/bash
set -e

echo "Building Wasm UDFs for Flink..."

# Create output directory
mkdir -p ../../lib/wasm

# Build QoE calculator
echo "Compiling QoE Calculator..."
emcc qoe_calculator.cpp \
  -O3 \
  -s WASM=1 \
  -s STANDALONE_WASM=1 \
  -s EXPORTED_FUNCTIONS='["_calculate_qoe","_classify_qoe"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -o ../../lib/wasm/qoe_calculator.wasm

# Build Anomaly Detector
echo "Compiling Anomaly Detector..."
emcc anomaly_detector.cpp \
  -O3 \
  -s WASM=1 \
  -s STANDALONE_WASM=1 \
  -s EXPORTED_FUNCTIONS='["_detect_anomaly","_calculate_anomaly_score"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -o ../../lib/wasm/anomaly_detector.wasm

echo "Wasm UDFs built successfully!"
echo "Files created:"
echo "  - ../../lib/wasm/qoe_calculator.wasm"
echo "  - ../../lib/wasm/anomaly_detector.wasm"

# Make files executable
chmod +x ../../lib/wasm/*.wasm

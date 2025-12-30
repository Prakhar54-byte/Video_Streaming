#!/bin/bash
set -e

echo "Building ML Inference Engine..."

# Create output directory
mkdir -p ../../lib/wasm

# Compile inference engine
emcc inference_engine.cpp \
  -O3 \
  -s WASM=1 \
  -s STANDALONE_WASM=1 \
  -s EXPORTED_FUNCTIONS='["_run_inference","_predict_viewer_churn"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -o ../../lib/wasm/inference_engine.wasm

echo "Inference engine built successfully!"
echo "Output: ../../lib/wasm/inference_engine.wasm"

# Set permissions
chmod +x ../../lib/wasm/inference_engine.wasm

#!/bin/bash
set -e

echo "Building all processing components..."

# Build Flink Wasm UDFs
echo "Building Flink Wasm UDFs..."
cd flink-jobs/wasm_udf
./compile.sh
cd ../..

# Build ML inference engine
echo "Building ML inference engine..."
cd anomaly-detection/cpp
./build_wasm.sh
cd ../..

echo "All components built successfully!"
echo "Generated files:"
ls -la lib/wasm/

echo "Processing pipeline ready for deployment!"

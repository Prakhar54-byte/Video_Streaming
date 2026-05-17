#!/bin/bash
set -e

echo "Installing dependencies..."
cd "$(dirname "$0")"
npm ci --only=production

echo "Starting application..."
exec node src/index.js
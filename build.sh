#!/bin/bash
set -e

echo "Starting multi-app build process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Build Tetris
echo "=== Building Tetris ==="
cd tetris || { echo "Failed to enter tetris directory"; exit 1; }
npm install --production=false
npm run build
mkdir -p ../public/tetris
if [ -d "dist" ]; then
    cp -r dist/* ../public/tetris/
    echo "✅ Tetris build completed"
else
    echo "❌ Tetris dist directory not found"
    exit 1
fi
cd ..

# Build Collaborative Canvas (Ink Pen)
echo "=== Building Collaborative Canvas ==="
cd collaborative-canvas || { echo "Failed to enter collaborative-canvas directory"; exit 1; }
npm install --production=false
npm run build
mkdir -p ../public/ink-pen
if [ -d "dist" ]; then
    cp -r dist/* ../public/ink-pen/
    echo "✅ Collaborative Canvas build completed"
else
    echo "❌ Collaborative Canvas dist directory not found"
    exit 1
fi
cd ..

# Build Daily Tracker
echo "=== Building Daily Tracker ==="
cd daily-tracking || { echo "Failed to enter daily-tracking directory"; exit 1; }
npm install --production=false
npm run build
mkdir -p ../public/daily-tracking
if [ -d "out" ]; then
    cp -r out/* ../public/daily-tracking/
    echo "✅ Daily Tracker build completed"
else
    echo "❌ Daily Tracker out directory not found"
    exit 1
fi
cd ..

echo "🎉 All builds completed successfully!"

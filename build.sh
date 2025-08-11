#!/bin/bash
set -e

echo "=== Vercel Build Debug Info ==="
echo "PWD: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Directory contents:"
ls -la

echo "=== Starting multi-app build process ==="

# Build Tetris
echo "=== Building Tetris ==="
if [ ! -d "tetris" ]; then
    echo "❌ tetris directory not found"
    exit 1
fi

cd tetris
echo "Installing Tetris dependencies..."
npm install
echo "Building Tetris..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Tetris build failed - no dist directory"
    exit 1
fi

mkdir -p ../public/tetris
cp -r dist/* ../public/tetris/
echo "✅ Tetris build completed"
cd ..

# Build Collaborative Canvas (Ink Pen)
echo "=== Building Collaborative Canvas ==="
if [ ! -d "collaborative-canvas" ]; then
    echo "❌ collaborative-canvas directory not found"
    exit 1
fi

cd collaborative-canvas
echo "Installing Collaborative Canvas dependencies..."
npm install
echo "Building Collaborative Canvas..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Collaborative Canvas build failed - no dist directory"
    exit 1
fi

mkdir -p ../public/ink-pen
cp -r dist/* ../public/ink-pen/
echo "✅ Collaborative Canvas build completed"
cd ..

# Build Daily Tracker
echo "=== Building Daily Tracker ==="
if [ ! -d "daily-tracking" ]; then
    echo "❌ daily-tracking directory not found"
    exit 1
fi

cd daily-tracking
echo "Installing Daily Tracker dependencies..."
npm install
echo "Building Daily Tracker..."
npm run build

if [ ! -d "out" ]; then
    echo "❌ Daily Tracker build failed - no out directory"
    echo "Checking for .next directory:"
    ls -la
    exit 1
fi

mkdir -p ../public/daily-tracking
cp -r out/* ../public/daily-tracking/
echo "✅ Daily Tracker build completed"
cd ..

echo "=== Final directory structure ==="
echo "public/ contents:"
ls -la public/
echo "public/tetris/ contents:"
ls -la public/tetris/ || echo "tetris directory empty"
echo "public/ink-pen/ contents:"
ls -la public/ink-pen/ || echo "ink-pen directory empty"
echo "public/daily-tracking/ contents:"
ls -la public/daily-tracking/ || echo "daily-tracking directory empty"

echo "🎉 All builds completed successfully!"

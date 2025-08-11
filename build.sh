#!/bin/bash
set -e

# Build Tetris
echo "Building Tetris..."
cd tetris
npm install
npm run build
mkdir -p ../public/tetris
cp -r dist/* ../public/tetris/
cd ..

# Build Collaborative Canvas (Ink Pen)
echo "Building Collaborative Canvas..."
cd collaborative-canvas
npm install
npm run build
mkdir -p ../public/ink-pen
cp -r dist/* ../public/ink-pen/
cd ..

# Build Daily Tracker
echo "Building Daily Tracker..."
cd daily-tracking
npm install
npm run build
mkdir -p ../public/daily-tracking
cp -r out/* ../public/daily-tracking/
cd ..

echo "All builds completed successfully!"

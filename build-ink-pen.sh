#!/bin/bash

# Build script for Digital Ink Pen
# This ensures both routes are always in sync

echo "Building Digital Ink Pen..."

# Navigate to the collaborative-canvas directory
cd collaborative-canvas

# Build the app
npm run build

# Copy the built files to the ink-pen route
echo "Syncing ink-pen route..."
cp -r ../public/collaborative-canvas/* ../public/ink-pen/

echo "Build and sync complete!"
echo "Both /collaborative-canvas and /ink-pen routes are now up to date."

#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...');

try {
  // Create directories
  console.log('📁 Creating public directories...');
  execSync('mkdir -p public/tetris public/ink-pen public/daily-tracking', { stdio: 'inherit' });
  
  // Copy main index.html
  console.log('📄 Copying main index.html...');
  execSync('cp index.html public/', { stdio: 'inherit' });
  
  // Build Tetris
  console.log('🎮 Building Tetris app...');
  process.chdir('tetris');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  execSync('cp -r dist/* ../public/tetris/', { stdio: 'inherit' });
  process.chdir('..');
  
  // Build Collaborative Canvas (builds directly to public/collaborative-canvas)
  console.log('🎨 Building Collaborative Canvas app...');
  process.chdir('collaborative-canvas');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  // The app builds directly to ../public/collaborative-canvas/
  // Copy to ink-pen directory for the /ink-pen route
  process.chdir('..');
  execSync('cp -r public/collaborative-canvas/* public/ink-pen/', { stdio: 'inherit' });
  
  // Build Daily Tracking is now a separate Vercel deployment
  // The daily-tracking app should be deployed separately as a server-side Next.js app
  console.log('📊 Skipping Daily Tracker - deployed separately with database functionality');
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

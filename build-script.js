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
  
  // Build Collaborative Canvas
  console.log('🎨 Building Collaborative Canvas app...');
  process.chdir('collaborative-canvas');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  execSync('cp -r dist/* ../public/ink-pen/', { stdio: 'inherit' });
  process.chdir('..');
  
  // Build Daily Tracking
  console.log('📊 Building Daily Tracking app...');
  process.chdir('daily-tracking');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  execSync('cp -r out/* ../public/daily-tracking/', { stdio: 'inherit' });
  process.chdir('..');
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

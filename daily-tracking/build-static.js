#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Daily Tracker for static export...');

try {
  // Create temporary backup directory for API routes (outside project)
  const apiDir = path.join(__dirname, 'src/app/api');
  const apiBackup = path.join(__dirname, '../api-backup-temp');
  
  // Move API routes temporarily
  if (fs.existsSync(apiDir)) {
    console.log('📂 Temporarily moving API routes...');
    fs.renameSync(apiDir, apiBackup);
  }
  
  // Build with static export
  console.log('🏗️  Building static export...');
  execSync('EXPORT=true npm run build', { stdio: 'inherit', env: { ...process.env, EXPORT: 'true' } });
  
  // Restore API routes
  if (fs.existsSync(apiBackup)) {
    console.log('🔄 Restoring API routes...');
    fs.renameSync(apiBackup, apiDir);
  }
  
  console.log('✅ Static build completed successfully!');
  
} catch (error) {
  console.error('❌ Static build failed:', error.message);
  
  // Restore API routes even if build failed
  const apiBackup = path.join(__dirname, '../api-backup-temp');
  const apiDir = path.join(__dirname, 'src/app/api');
  if (fs.existsSync(apiBackup) && !fs.existsSync(apiDir)) {
    console.log('🔄 Restoring API routes after failure...');
    fs.renameSync(apiBackup, apiDir);
  }
  
  process.exit(1);
}

const fs = require('fs');

// Generate a simple SVG icon with the Daily Tracker "DT" initials
function generateIcon(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const iconSize = size - (padding * 2);
  const fontSize = iconSize * 0.3;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${maskable ? `<rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.2}"/>` : ''}
  <rect x="${padding}" y="${padding}" width="${iconSize}" height="${iconSize}" fill="#3b82f6" rx="${iconSize * 0.15}"/>
  <text x="${size/2}" y="${size/2 + fontSize/3}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">DT</text>
</svg>`;
}

// Generate all required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

sizes.forEach(size => {
  const svg = generateIcon(size);
  fs.writeFileSync(`icon-${size}.svg`, svg);
  console.log(`Generated icon-${size}.svg`);
});

maskableSizes.forEach(size => {
  const svg = generateIcon(size, true);
  fs.writeFileSync(`icon-maskable-${size}.svg`, svg);
  console.log(`Generated icon-maskable-${size}.svg`);
});

// Generate shortcut icons
const addTaskIcon = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#10b981" rx="20"/>
  <path d="M48 20v56M20 48h56" stroke="white" stroke-width="6" stroke-linecap="round"/>
</svg>`;

const calendarIcon = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#8b5cf6" rx="20"/>
  <rect x="16" y="24" width="64" height="56" fill="white" rx="4"/>
  <rect x="16" y="24" width="64" height="16" fill="#8b5cf6" rx="4"/>
  <circle cx="32" cy="32" r="2" fill="white"/>
  <circle cx="48" cy="32" r="2" fill="white"/>
  <circle cx="64" cy="32" r="2" fill="white"/>
  <rect x="24" y="48" width="8" height="6" fill="#8b5cf6"/>
  <rect x="40" y="48" width="8" height="6" fill="#8b5cf6"/>
  <rect x="56" y="48" width="8" height="6" fill="#8b5cf6"/>
</svg>`;

fs.writeFileSync('shortcut-add.svg', addTaskIcon);
fs.writeFileSync('shortcut-calendar.svg', calendarIcon);

console.log('Generated shortcut icons');
console.log('Icon generation complete!');

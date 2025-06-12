import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original manifest
const manifestPath = path.join(__dirname, '../src/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Update paths for manifest v3
const updatedManifest = {
  ...manifest,
  // No need to modify default_popup as we're already in the dist directory
  background: {
    ...manifest.background,
    // Ensure the background script path is correct
    service_worker: 'background.js'
  }
};

// Ensure the dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write the updated manifest to the dist directory
const distManifestPath = path.join(distDir, 'manifest.json');
fs.writeFileSync(distManifestPath, JSON.stringify(updatedManifest, null, 2));

console.log('Manifest updated successfully!');

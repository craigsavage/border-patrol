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
  action: {
    ...manifest.action,
    default_popup: manifest.action.default_popup.replace('popup/', 'dist/popup/')
  },
  web_accessible_resources: [
    {
      resources: ['dist/scripts/*.js', 'dist/styles/*.css'],
      matches: ['<all_urls>']
    }
  ]
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

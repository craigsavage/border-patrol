import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original manifest
const manifestPath = path.join(__dirname, '../manifest.json');
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

// Write the updated manifest to the dist directory
const distManifestPath = path.join(__dirname, '../dist/manifest.json');
fs.writeFileSync(distManifestPath, JSON.stringify(updatedManifest, null, 2));

console.log('Manifest updated successfully!');

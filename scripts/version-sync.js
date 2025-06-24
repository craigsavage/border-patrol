// This script synchronizes the version number across package.json, manifest.json, and menu.html files.
// It reads the version from package.json and updates the other files accordingly.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to the files we need to update
const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestPath = path.join(rootDir, 'src', 'manifest.json');
const menuHtmlPath = path.join(rootDir, 'src', 'popup', 'menu.html');

// Read the current version from package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;
console.log(`Current version from package.json: ${version}`);

// Update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
if (manifest.version !== version) {
  manifest.version = version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Updated manifest.json to version ${version}`);
}

// Update menu.html version in the footer
let menuHtml = fs.readFileSync(menuHtmlPath, 'utf-8');
const versionRegex = /<span class="version">.*?<\/span>/;

// Replace the version in the footer
menuHtml = menuHtml.replace(
  versionRegex,
  `<span class="version">v${version}</span>`
);

fs.writeFileSync(menuHtmlPath, menuHtml);
console.log(`Updated menu.html with version ${version}`);

console.log('Version sync complete!');

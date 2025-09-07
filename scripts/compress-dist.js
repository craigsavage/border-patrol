import { readFileSync, createWriteStream, existsSync, mkdirSync } from 'fs';
import archiver from 'archiver';

// Read the version from package.json
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

// Create the output directory if it doesn't exist
const outputDir = 'dist-zips';
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}
const outputPath = `${outputDir}/border-patrol-${pkg.version}.zip`;

// Create the output stream and archive
const output = createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 }, // Set the compression level
});

output.on('close', () => {
  console.log(
    `Successfully created: ${outputPath} | ${archive.pointer()} total bytes`
  );
});

archive.on('error', err => {
  throw err;
});

// Pipe the archive data to the output file
archive.pipe(output);

// Append files from the dist directory
archive.directory('dist/', false);
archive.finalize();

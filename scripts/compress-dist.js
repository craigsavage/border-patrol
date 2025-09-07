import { createWriteStream } from 'fs';
import archiver from 'archiver';

// Create a zip archive of the dist folder
const output = createWriteStream('dist.zip');
const archive = archiver('zip', {
  zlib: { level: 9 }, // Set the compression level
});

output.on('close', () => {
  console.log(`Archive created successfully: ${archive.pointer()} total bytes`);
});

archive.on('error', err => {
  throw err;
});

// Pipe the archive data to the output file
archive.pipe(output);

// Append files from the dist directory
archive.directory('dist/', false);
archive.finalize();

const fs = require('fs');
const path = require('path');

// Define base directory for the app
const basePath = path.resolve(__dirname, 'src/app');

// Define subdirectories to ensure they exist
const directories = [
  'dto',
  'interfaces',
  'schemas'
];

// Ensure all directories exist
directories.forEach(dir => {
  const dirPath = path.join(basePath, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

console.log('Directory structure verified.');

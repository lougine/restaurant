const fs = require('fs');
const path = require('path');

const buildDirectory = path.join(__dirname, '..', 'build');
const publicDirectory = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'public');

if (!fs.existsSync(path.join(buildDirectory, 'index.html'))) {
  throw new Error('React build output is missing. Run the production build first.');
}

fs.cpSync(buildDirectory, publicDirectory, { recursive: true });
console.log('Copied the React build into Vercel public assets.');

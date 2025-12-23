const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outFile = path.join(__dirname, 'dist/flex.js');

// Ensure dist directory exists
if (!fs.existsSync(path.dirname(outFile))) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
}

/**
 * Recursively gets all .js files in a directory
 */
const getAllFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else if (file.name.endsWith('.js')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
};

console.log('🔨 Building FLEX bundle from nested directories...');

const allFiles = getAllFiles(srcDir);

const combinedContent = allFiles.map(filePath => {
    // Get a clean relative path for the header (e.g., "collections/shuffle.js")
    const relativePath = path.relative(srcDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    return `// --- Module: ${relativePath} ---\n${content}`;
}).join('\n\n');

fs.writeFileSync(outFile, combinedContent);

console.log(`✅ Bundle created at: ${outFile}`);
console.log(`📦 Total modules combined: ${allFiles.length}`);

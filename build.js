const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outFile = path.join(__dirname, 'dist/flex.js');

// Ensure dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'));
}

console.log('🔨 Building FLEX bundle...');

// Get all .js files in src
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

const combinedContent = files.map(file => {
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    return `// --- Module: ${file} ---\n${content}`;
}).join('\n\n');

fs.writeFileSync(outFile, combinedContent);

console.log(`✅ Bundle created at: ${outFile} (${files.length} modules combined)`);

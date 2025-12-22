const { execSync, spawn } = require('child_process');

module.exports = async () => {
    console.log('\n🐳 Starting FalkorDB via Docker...');

    // Pull the image if it doesn't exist (optional, but good for CI)
    // execSync('docker pull falkordb/falkordb:latest');

    const containerName = 'flex_test_db';
    
    // Start the container
    const dockerProcess = spawn('docker', [
        'run',
        '--name', containerName,
        '--rm',                 // Automatically remove container on exit
        '-p', '6379:6379',      // Map default port
        'falkordb/falkordb:latest'
    ]);

    global.__FALKOR_CONTAINER_NAME__ = containerName;

    // Wait for Docker/FalkorDB to be ready
    return new Promise((resolve, reject) => {
        dockerProcess.stdout.on('data', (data) => {
            if (data.toString().includes('Ready to accept connections')) {
                console.log('✅ FalkorDB Docker container is ready');
                resolve();
            }
        });

        dockerProcess.stderr.on('data', (data) => {
            // Check if name is already in use and handle it
            if (data.toString().includes('already in use')) {
                console.error('❌ Container name already in use. Try: docker rm -f flex_test_db');
                reject(new Error('Docker name conflict'));
            }
        });

        setTimeout(() => reject('Docker FalkorDB failed to start in 90s'), 90000);
    });
};

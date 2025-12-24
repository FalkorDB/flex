/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { execSync } = require('child_process');

module.exports = async () => {
    console.log('\n🛑 Stopping FalkorDB Docker container...');
    try {
        const name = global.__FALKOR_CONTAINER_NAME__;
        execSync(`docker stop ${name}`);
        console.log('✅ Container stopped and removed.');
    } catch (err) {
        console.error('❌ Failed to stop Docker container:', err.message);
    }
};

/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { execSync } = require('child_process');

// Keep this in sync with tests/globalSetup.js
const USE_LOCAL_FALKORDB = process.env.FLEX_USE_LOCAL_FALKORDB === '1';

module.exports = async () => {
    if (USE_LOCAL_FALKORDB) {
        console.log('\n🟢 FLEX_USE_LOCAL_FALKORDB=1 set; not stopping any Docker container.');
        return;
    }

    console.log('\n🛑 Stopping FalkorDB Docker container...');
    try {
        const name = global.__FALKOR_CONTAINER_NAME__;
        execSync(`docker stop ${name}`);
        console.log('✅ Container stopped and removed.');
    } catch (err) {
        console.error('❌ Failed to stop Docker container:', err.message);
    }
};

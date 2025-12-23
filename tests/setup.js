const fs = require('fs');
const path = require('path');
const { FalkorDB } = require('falkordb');

async function initializeFLEX(graphName = 'G') {
    const db = await FalkorDB.connect();
	const conn = await db.connection;
	const graph = db.selectGraph(graphName);

    // 1. Load FLEX into FalkorDB
    const textSrc = fs.readFileSync(path.join(__dirname, '../dist/flex.js'), 'utf8');

    try {
        await conn.sendCommand(['GRAPH.UDF', 'LOAD', 'REPLACE', 'flex', textSrc]);
        console.log("✅ FLEX library loaded successfully");
    } catch (err) {
        console.error("❌ Failed to load FLEX:", err);
        throw err;
    }

    return { db, graph };
}

module.exports = { initializeFLEX };

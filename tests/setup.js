const fs = require('fs');
const path = require('path');
const { FalkorDB } = require('falkordb');

async function initializeFLEX(graphName = 'G') {
    const db = await FalkorDB.connect();
	const conn = await db.connection;
	const graph = db.selectGraph(graphName);

    // 1. Load the source files from src/
    const textSrc = fs.readFileSync(path.join(__dirname, '../src/collections.js'), 'utf8');

    // 2. Register functions into FalkorDB
    try {
		console.log("conn:" + conn);
        await conn.sendCommand(['GRAPH.UDF', 'LOAD', 'flex', textSrc]);
        console.log("✅ FLEX library loaded successfully");
    } catch (err) {
        console.error("❌ Failed to load FLEX:", err);
        throw err;
    }

    return { db, graph };
}

module.exports = { initializeFLEX };

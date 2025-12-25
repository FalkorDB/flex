/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

module.exports = {
	setupFilesAfterEnv: ['./tests/jest.setup.js'],

	// For now, do not collect coverage by default for integration tests.
	// You can still run `jest --coverage` or `npm test -- --coverage` locally
	// when you want a report, but CI and default runs won't be gated by
	// unrealistic global thresholds.
	collectCoverage: false,

	// When coverage is explicitly enabled, only consider the Flex source files.
	collectCoverageFrom: [
		"src/**/*.js",
	],

	// The directory where Jest should output the report files
	coverageDirectory: "coverage",

	// Choose the types of reports you want when coverage is enabled.
	coverageReporters: ["text", "html", "lcov"],

	// NOTE: We intentionally do *not* set coverageThreshold here because the
	// Flex integration tests exercise code inside FalkorDB via GRAPH.UDF, so
	// Jest's Node-side coverage cannot reflect real test coverage and would
	// always fail. Thresholds can be reintroduced later once we add proper
	// unit tests that import src modules directly.

	globalSetup: './tests/globalSetup.js',
	globalTeardown: './tests/globalTeardown.js',
	testTimeout: 30000, // 30 seconds
	testEnvironment: 'node'
};


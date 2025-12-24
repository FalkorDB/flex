/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

module.exports = {
	setupFilesAfterEnv: ['./tests/jest.setup.js'],

	// Tells Jest to collect coverage
	collectCoverage: true,

	// Specifies which files to include/exclude
	collectCoverageFrom: [
		"src/**/*.js",
	],

	// The directory where Jest should output the report files
	coverageDirectory: "coverage",

	// Choose the types of reports you want
	// 'text' shows it in the terminal, 'html' creates a clickable website
	coverageReporters: ["text", "html", "lcov"],

	coverageThreshold: {
		global: {
			branches: 80,
			functions: 90,
			lines: 90,
			statements: 90
		}
	},

	globalSetup: './tests/globalSetup.js',
	globalTeardown: './tests/globalTeardown.js',
	testTimeout: 30000, // 30 seconds
	testEnvironment: 'node'
};


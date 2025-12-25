#!/usr/bin/env node

/**
 * Copyright FalkorDB Ltd. 2023 - present
 * 
 * Version Validation Script
 * 
 * This script validates that:
 * 1. The release tag version matches the version in package.json
 * 2. The new version is greater than all previously released versions
 * 
 * Usage: node validate-version.js <tag-name>
 * Example: node validate-version.js v1.0.1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Semantic version regex pattern
// Matches: MAJOR.MINOR.PATCH[-PRERELEASE]
// PRERELEASE format: alphanumeric identifiers separated by dots (e.g., alpha.1, beta-rc.2)
const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/**
 * Parse a semantic version string into components
 * @param {string} version - Version string (e.g., "1.0.0" or "v1.0.0")
 * @returns {object} - Object with major, minor, patch numbers
 */
function parseVersion(version) {
  // Remove 'v' prefix if present
  const cleanVersion = version.replace(/^v/, '');
  
  const match = cleanVersion.match(SEMVER_REGEX);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || '',
    original: version,
    clean: cleanVersion
  };
}

/**
 * Compare two semantic versions
 * @param {object} v1 - First version (parsed)
 * @param {object} v2 - Second version (parsed)
 * @returns {number} - -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  // Compare major, minor, and patch versions
  if (v1.major !== v2.major) {
    return v1.major > v2.major ? 1 : -1;
  }
  if (v1.minor !== v2.minor) {
    return v1.minor > v2.minor ? 1 : -1;
  }
  if (v1.patch !== v2.patch) {
    return v1.patch > v2.patch ? 1 : -1;
  }
  
  // If major.minor.patch are equal, handle prerelease versions
  // Per semver spec: 1.0.0-alpha < 1.0.0 (prerelease has lower precedence)
  if (v1.prerelease && !v2.prerelease) {
    return -1; // v1 is a prerelease, v2 is stable -> v1 < v2
  }
  if (!v1.prerelease && v2.prerelease) {
    return 1; // v1 is stable, v2 is a prerelease -> v1 > v2
  }
  if (v1.prerelease && v2.prerelease) {
    // Both are prereleases, compare lexicographically
    if (v1.prerelease < v2.prerelease) return -1;
    if (v1.prerelease > v2.prerelease) return 1;
  }
  
  return 0;
}

/**
 * Get all existing release tags from GitHub
 * @returns {string[]} - Array of tag names
 */
function getExistingTags() {
  try {
    const output = execSync('git tag', { 
      encoding: 'utf8',
      timeout: 10000 // 10 second timeout
    });
    return output.trim().split('\n').filter(tag => tag.length > 0);
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not fetch git tags: ${error.message}${colors.reset}`);
    console.warn(`${colors.yellow}Assuming no previous releases.${colors.reset}`);
    return [];
  }
}

/**
 * Main validation function
 */
function validateVersion() {
  // Get the tag name from command line argument
  const tagName = process.argv[2];
  
  if (!tagName) {
    console.error(`${colors.red}Error: Tag name is required${colors.reset}`);
    console.error('Usage: node validate-version.js <tag-name>');
    process.exit(1);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔍 FLEX Version Validation');
  console.log(`${'='.repeat(60)}\n`);
  
  // Read package.json - using process.cwd() to ensure we read from the repository root
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let packageJson;
  
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.error(`${colors.red}Error: Could not read package.json at ${packageJsonPath}${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
  
  const packageVersion = packageJson.version;
  console.log(`📦 package.json version: ${packageVersion}`);
  console.log(`🏷️  Release tag: ${tagName}`);
  
  // Parse versions
  let tagVersion, pkgVersion;
  
  try {
    tagVersion = parseVersion(tagName);
    pkgVersion = parseVersion(packageVersion);
  } catch (error) {
    console.error(`\n${colors.red}❌ Version Parsing Error${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
  
  // Validation 1: Tag version must match package.json version
  console.log(`\n${'─'.repeat(60)}`);
  console.log('Validation 1: Tag version matches package.json version');
  console.log(`${'─'.repeat(60)}`);
  
  if (tagVersion.clean !== pkgVersion.clean) {
    console.error(`${colors.red}❌ VALIDATION FAILED${colors.reset}`);
    console.error(`\nRelease tag version (${tagVersion.clean}) does not match package.json version (${pkgVersion.clean})`);
    console.error(`\nPlease update package.json to version ${tagVersion.clean} or use tag v${pkgVersion.clean}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ PASSED${colors.reset} - Versions match: ${tagVersion.clean}`);
  
  // Validation 2: New version must be greater than all previous versions
  console.log(`\n${'─'.repeat(60)}`);
  console.log('Validation 2: New version is greater than previous releases');
  console.log(`${'─'.repeat(60)}`);
  
  const existingTags = getExistingTags();
  
  if (existingTags.length === 0) {
    console.log(`${colors.green}✅ PASSED${colors.reset} - No previous releases found. This is the first release.`);
  } else {
    console.log(`Found ${existingTags.length} existing tag(s): ${existingTags.join(', ')}`);
    
    let maxVersion = null;
    let maxVersionTag = null;
    
    for (const tag of existingTags) {
      try {
        const existingVersion = parseVersion(tag);
        
        // Compare with current tag (should not already exist)
        if (compareVersions(existingVersion, tagVersion) === 0) {
          console.error(`\n${colors.red}❌ VALIDATION FAILED${colors.reset}`);
          console.error(`\nTag ${tagName} already exists!`);
          console.error(`Please use a different version number.`);
          process.exit(1);
        }
        
        // Track the maximum version
        if (!maxVersion || compareVersions(existingVersion, maxVersion) > 0) {
          maxVersion = existingVersion;
          maxVersionTag = tag;
        }
      } catch (error) {
        // Skip tags that don't follow semantic versioning
        console.warn(`${colors.yellow}Warning: Skipping non-semver tag '${tag}': ${error.message}${colors.reset}`);
      }
    }
    
    if (maxVersion) {
      console.log(`\nLatest released version: ${maxVersion.clean} (${maxVersionTag})`);
      console.log(`New version: ${tagVersion.clean} (${tagName})`);
      
      const comparison = compareVersions(tagVersion, maxVersion);
      
      if (comparison === 0) {
        // This should have been caught earlier by duplicate tag check, but handle it here too
        console.error(`\n${colors.red}❌ VALIDATION FAILED${colors.reset}`);
        console.error(`\nNew version ${tagVersion.clean} is equal to the latest released version`);
        console.error(`\nPlease use a version number greater than ${maxVersion.clean}`);
        process.exit(1);
      } else if (comparison < 0) {
        console.error(`\n${colors.red}❌ VALIDATION FAILED${colors.reset}`);
        console.error(`\nNew version ${tagVersion.clean} is less than the latest released version ${maxVersion.clean}`);
        console.error(`\nPlease use a version number greater than ${maxVersion.clean}`);
        process.exit(1);
      }
      
      console.log(`${colors.green}✅ PASSED${colors.reset} - New version is greater than the latest release`);
    }
  }
  
  // All validations passed
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.green}🎉 All validations passed!${colors.reset}`);
  console.log(`${colors.green}✅ Version ${tagVersion.clean} is valid and ready for release${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run validation
validateVersion();

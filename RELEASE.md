# Release Process for FLEX

This document describes how to release a new version of FLEX to npm and GitHub Releases.

## Overview

FLEX uses automated GitHub Actions workflows to publish releases. When a new version tag is pushed or a GitHub release is created, the library is automatically built, tested, and published to:

1. **npm** as `@falkordb/flex`
2. **GitHub Releases** with the compiled `flex.js` bundle attached

## Prerequisites

Before creating a release, ensure:

1. All tests pass locally: `npm test`
2. The build succeeds: `npm run build`
3. The `dist/flex.js` file is up to date and committed
4. All changes are merged to the `main` branch

## Release Steps

### Option 1: GitHub Release (Recommended)

1. Go to the [Releases page](https://github.com/FalkorDB/flex/releases)
2. Click "Draft a new release"
3. Click "Choose a tag" and create a new tag (e.g., `v1.0.1`)
4. Fill in the release title and description
5. Click "Publish release"

The GitHub Actions workflow will automatically:
- Build the FLEX bundle
- Run all tests
- Publish to npm as `@falkordb/flex`
- Attach `flex.js` to the GitHub release

### Option 2: Command Line Tag

```bash
# Ensure you're on the main branch and up to date
git checkout main
git pull

# Create and push a new version tag
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1

# Then create a GitHub release from the tag
```

After pushing the tag, create a GitHub release from the tag on the GitHub UI, which will trigger the automated publishing workflow.

## Version Numbering

FLEX follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (v2.0.0): Incompatible API changes
- **MINOR** (v1.1.0): New functionality, backward compatible
- **PATCH** (v1.0.1): Bug fixes, backward compatible

Update the version in `package.json` before creating a release.

## Manual Publishing (Not Recommended)

If you need to publish manually:

```bash
# Build the library
npm run build

# Run tests
npm test

# Publish to npm (requires npm authentication)
npm publish --access public
```

## NPM Authentication

Publishing to npm requires an `NPM_TOKEN` secret to be configured in the GitHub repository settings. This token should have:

- **Automation** type token (for provenance)
- **Publish** permission for the `@falkordb/flex` package

To set up the token:
1. Create an npm access token at https://www.npmjs.com/settings/[username]/tokens
2. Add it as a secret named `NPM_TOKEN` in the GitHub repository settings

## Verifying the Release

After publishing:

1. Check npm: https://www.npmjs.com/package/@falkordb/flex
2. Check GitHub Releases: https://github.com/FalkorDB/flex/releases
3. Test installation: `npm install @falkordb/flex`

## Troubleshooting

### Build Fails
- Ensure all source files in `src/` are valid JavaScript
- Check build.js for any errors

### Tests Fail
- Ensure FalkorDB/Redis is running (if required for integration tests)
- Check test logs for specific failures

### npm Publish Fails
- Verify `NPM_TOKEN` is correctly set in GitHub secrets
- Ensure you're not trying to publish a version that already exists
- Check that the package name `@falkordb/flex` is available/owned

### GitHub Release Attachment Fails
- Verify the workflow has write permissions for contents
- Check that `dist/flex.js` exists after the build step

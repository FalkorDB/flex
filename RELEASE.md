# Release Process for FLEX

This document describes how to release a new version of FLEX and publish it as a GitHub Release with the compiled `flex.js` bundle attached.

## Overview

FLEX uses automated GitHub Actions workflows to build and publish releases. When a new GitHub release is created, the library is automatically built, tested, and the `flex.js` bundle is attached to the GitHub Release as a downloadable artifact.

## Prerequisites

Before creating a release, ensure:

1. All tests pass locally: `npm test`
2. The build succeeds: `npm run build`
3. The `dist/flex.js` file is up to date and committed to the repository
4. All changes are merged to the `main` branch

## Release Steps

### Creating a GitHub Release

1. Go to the [Releases page](https://github.com/FalkorDB/flex/releases)
2. Click "Draft a new release"
3. Click "Choose a tag" and create a new tag (e.g., `v1.0.1`)
4. Fill in the release title (e.g., "FLEX v1.0.1")
5. Write a description of changes included in this release
6. Click "Publish release"

The GitHub Actions workflow will automatically:
- Build the FLEX bundle from source
- Run all tests to ensure quality
- Attach the compiled `flex.js` file to the release

### Alternative: Command Line Tag and Manual Release

```bash
# Ensure you're on the main branch and up to date
git checkout main
git pull

# Create and push a new version tag
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1

# Then create a GitHub release from the tag on the GitHub UI
```

After pushing the tag, go to GitHub and create a release from that tag, which will trigger the automated workflow.

## Version Numbering

FLEX follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (v2.0.0): Incompatible API changes
- **MINOR** (v1.1.0): New functionality, backward compatible
- **PATCH** (v1.0.1): Bug fixes, backward compatible

Update the version in `package.json` before creating a release.

## Using a Published Release

Once a release is published, users can download `flex.js` directly from the GitHub Releases page:

```bash
# Download the latest flex.js
curl -L -o flex.js https://github.com/FalkorDB/flex/releases/latest/download/flex.js

# Load into FalkorDB instance
redis-cli -h<host> -p<port> GRAPH.UDF LOAD flex "$(cat flex.js)"
```

Or download a specific version:

```bash
# Download specific version
curl -L -o flex.js https://github.com/FalkorDB/flex/releases/download/v1.0.0/flex.js
```

## Manual Workflow Trigger

You can also manually trigger the publish workflow from the Actions tab:

1. Go to [Actions](https://github.com/FalkorDB/flex/actions)
2. Select "Publish FLEX" workflow
3. Click "Run workflow"
4. Enter the tag name (e.g., `v1.0.0`)
5. Click "Run workflow"

This is useful for re-attaching files to an existing release if needed.

## Verifying the Release

After publishing:

1. Check GitHub Releases: https://github.com/FalkorDB/flex/releases
2. Verify `flex.js` is attached to the release
3. Download and test the file:
   ```bash
   curl -L -o flex.js https://github.com/FalkorDB/flex/releases/download/v1.0.0/flex.js
   ```

## Troubleshooting

### Build Fails
- Ensure all source files in `src/` are valid JavaScript
- Check build.js for any errors
- Review the build logs in the GitHub Actions workflow

### Tests Fail
- Ensure all tests pass locally before creating a release
- Check test logs in the GitHub Actions workflow for specific failures

### File Not Attached to Release
- Verify the workflow has write permissions for contents
- Check that `dist/flex.js` exists after the build step in the workflow logs
- Ensure the `GITHUB_TOKEN` has appropriate permissions

### Workflow Doesn't Trigger
- Verify the release was published (not saved as draft)
- Check the workflow file syntax is valid
- Ensure the workflow file is on the default branch


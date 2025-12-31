# Release Process for FLEX

This document describes how to release a new version of FLEX and publish it as a GitHub Release with the compiled `flex.js` bundle attached.

## Overview

FLEX uses automated GitHub Actions workflows to build and publish releases. When a new GitHub release is created, the library is automatically built, tested, and the `flex.js` bundle is attached to the GitHub Release as a downloadable artifact.

## Prerequisites

Before creating a release, ensure:

1. **Update the version in `package.json`** to match the release tag you plan to create (e.g., if creating tag `v1.0.1`, set version to `1.0.1`)
2. All tests pass locally: `npm test`
3. The build succeeds: `npm run build`
4. The `dist/flex.js` file is up to date and committed to the repository
5. All changes are merged to the `main` branch

**Important**: The release tag version **must** match the version in `package.json` and must be greater than all previously released versions. The automated workflow will validate this and fail if the versions don't match or if the new version is not greater than existing releases.

## Release Steps

### Creating a GitHub Release

**Important**: Before creating a release, update the version in `package.json` to match your intended release tag.

1. **Update `package.json`**: Change the version field to your new version (e.g., `1.0.1` for tag `v1.0.1`)
2. Commit and push the version change to the `main` branch
3. Go to the [Releases page](https://github.com/FalkorDB/flex/releases)
4. Click "Draft a new release"
5. Click "Choose a tag" and create a new tag matching the `package.json` version (e.g., `v1.0.1`)
6. Fill in the release title (e.g., "FLEX v1.0.1")
7. Write a description of changes included in this release
8. Click "Publish release"

The GitHub Actions workflow will automatically:
- Validate that the release tag version matches `package.json` version
- Validate that the new version is greater than all previous releases
- Build the FLEX bundle from source
- Run all tests to ensure quality
- Attach the compiled `flex.js` file to the release

If validation fails, the release will be aborted with an error message explaining the issue.

### Alternative: Command Line Tag and Manual Release

```bash
# Ensure you're on the main branch and up to date
git checkout main
git pull

# Update package.json version (e.g., to 1.0.1)
# Edit package.json and change the "version" field

# Commit the version change
git add package.json
git commit -m "Bump version to 1.0.1"
git push

# Create and push a new version tag (matching package.json version)
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

**Always update the version in `package.json` before creating a release.** The version in `package.json` must match the release tag (without the 'v' prefix), and must be greater than all previous releases.

### Version Validation

The release workflow automatically validates:
1. The release tag version matches the `package.json` version (e.g., tag `v1.0.1` must match `package.json` version `1.0.1`)
2. The new version is greater than all previously released versions
3. The tag doesn't already exist

If any validation fails, the release workflow will fail with a descriptive error message.

## Using a Published Release

Once a release is published, users can download `flex.js` directly from the GitHub Releases page:

```bash
# Download the latest flex.js
curl -L -o flex.js https://github.com/FalkorDB/flex/releases/latest/download/flex.js

# Load into FalkorDB instance
redis-cli -h <host> -p <port> GRAPH.UDF LOAD flex "$(cat flex.js)"
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
   curl -L -o flex.js https://github.com/FalkorDB/flex/releases/download/vX.Y.Z/flex.js
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


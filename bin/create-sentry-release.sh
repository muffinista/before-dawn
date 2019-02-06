#!/usr/bin/env bash

#VERSION=$(sentry-cli releases propose-version)

VERSION=$(bin/get-release-name)

echo "VERSION: $VERSION"

# Create a release
sentry-cli releases new $VERSION

# Associate commits with the release
sentry-cli releases set-commits --auto $VERSION

# upload source maps
sentry-cli releases files $VERSION upload-sourcemaps output

sentry-cli releases finalize $VERSION

# notify about new deploy
sentry-cli releases deploys $VERSION new --env production

# upload symbols
bin/sentry-symbols.js
const { version } = require('./package.json');

// package.json must hold a valid semver (1.0.0). KWE shows versions as 1.00.00.
const [major, minor, patch] = version.split('.');
const displayVersion = `${major}.${minor.padStart(2, '0')}.${patch.padStart(2, '0')}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Builds a self-contained server in .next/standalone for the Docker image.
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: displayVersion,
  },
};

module.exports = nextConfig;

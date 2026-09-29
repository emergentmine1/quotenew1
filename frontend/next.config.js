const { version } = require('./package.json');

// package.json must hold a valid semver (1.0.0). KWE shows versions as 1.00.00.
const [major, minor, patch] = version.split('.');
const displayVersion = `${major}.${minor.padStart(2, '0')}.${patch.padStart(2, '0')}`;

// Hosts allowed to invoke Server Actions. Next.js rejects a forwarded Server Action when the
// Origin header does not match the forwarded host, which happens behind a reverse proxy or load
// balancer (the browser sees the public domain, Next sees the internal one). List the public
// domain(s) here. Set SERVER_ACTIONS_ALLOWED_ORIGINS (comma separated, wildcards allowed such as
// "*.example.com") to your own domain(s) in each environment. Without a proxy this can stay empty.
const allowedOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Builds a self-contained server in .next/standalone for the Docker image.
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: displayVersion,
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

module.exports = nextConfig;

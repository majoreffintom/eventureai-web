#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set environment variable to tell esbuild where to find async_hooks
process.env.NODE_PATH = path.join(__dirname, 'polyfills');

// Run the Cloudflare build
try {
  execSync('npx @cloudflare/next-on-pages', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PATH: path.join(__dirname, 'polyfills')
    }
  });
} catch (error) {
  process.exit(1);
}

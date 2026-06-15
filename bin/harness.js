#!/usr/bin/env node
import { runCli } from '../lib/cli.js';

runCli(process.argv.slice(2)).catch((err) => {
  console.error(err.message || err);
  process.exit(typeof err.exitCode === 'number' ? err.exitCode : 1);
});

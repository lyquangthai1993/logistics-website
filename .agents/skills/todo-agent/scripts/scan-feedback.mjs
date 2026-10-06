#!/usr/bin/env node

/**
 * Helper script inside todo-agent skill
 * Forwards execution to root scripts/todo-agent.mjs
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootRunner = path.resolve(__dirname, '../../../../scripts/todo-agent.mjs');

// Dynamically import and run root runner
await import(`file://${rootRunner.replace(/\\/g, '/')}`);

// src/tests/setup.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') });

// Setup module aliases
require('module-alias/register');
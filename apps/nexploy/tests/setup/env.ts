import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const APP_ROOT = resolve(here, '../..');
export const REPO_ROOT = resolve(APP_ROOT, '../..');

config({ path: resolve(APP_ROOT, '.env.test'), override: true, quiet: true });

export const TEST_DATABASE_URL = process.env.DATABASE_URL as string;

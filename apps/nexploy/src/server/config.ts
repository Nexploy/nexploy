import { readFileSync } from 'fs';
import { join } from 'path';

export const isDev = process.env.NODE_ENV !== 'production';

export const port = parseInt(process.env.NEXPLOY_PORT || '3000', 10);

export const nextHostname = isDev ? '0.0.0.0' : 'localhost';

export function resolveStandaloneConf() {
    if (isDev) return undefined;

    const requiredServerFiles = join(process.cwd(), '.next', 'required-server-files.json');
    const conf = JSON.parse(readFileSync(requiredServerFiles, 'utf-8')).config;

    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(conf);

    return conf;
}

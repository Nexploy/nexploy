import * as path from 'path';

export const TRAEFIK_SERVICE_DIR =
    process.env.TRAEFIK_SERVICE_DIR ??
    path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

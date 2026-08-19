export function getInstancePublicUrl(): string {
    return (process.env.NEXPLOY_URL ?? process.env.BETTER_AUTH_URL ?? '').replace(/\/+$/, '');
}

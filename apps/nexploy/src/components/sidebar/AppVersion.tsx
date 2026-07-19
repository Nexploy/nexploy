import { kyDocker } from '@/lib/api/kyDocker';

async function getAppVersion(): Promise<string> {
    if (process.env.NODE_ENV !== 'production') {
        return 'dev';
    }

    try {
        const { current } = await kyDocker
            .get('system/version', { timeout: 10_000 })
            .json<{ current: string }>();
        return current;
    } catch {
        return 'unknown';
    }
}

export async function AppVersion() {
    const version = await getAppVersion();

    return <span className="text-muted-foreground truncate text-xs leading-3">{version}</span>;
}

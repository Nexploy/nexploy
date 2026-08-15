'use client';

import { Key } from 'lucide-react';
import { useTranslations } from 'next-intl';
import CopyButton from '@/components/shared/CopyButton.tsx';

interface RunnerTokenPanelProps {
    token: string;
    runnerName: string;
    serverUrl: string;
}

export function buildRunnerDockerCommand(token: string, runnerName: string, serverUrl: string): string {
    return [
        'docker run -d \\',
        '  --name nexploy-build-runner \\',
        '  --restart unless-stopped \\',
        `  -e NEXPLOY_URL=${serverUrl} \\`,
        `  -e NEXPLOY_RUNNER_TOKEN=${token} \\`,
        `  -e NEXPLOY_RUNNER_NAME=${runnerName} \\`,
        '  -v /var/run/docker.sock:/var/run/docker.sock \\',
        '  -v nexploy-runner-workspace:/workspace \\',
        '  nexploy/build-runner:latest',
    ].join('\n');
}

export function RunnerTokenPanel({ token, runnerName, serverUrl }: RunnerTokenPanelProps) {
    const t = useTranslations('admin.buildRunners');
    const command = buildRunnerDockerCommand(token, runnerName, serverUrl);

    return (
        <div className="flex min-w-0 flex-col gap-3 pt-1">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border p-3">
                <Key className="size-4 shrink-0 text-muted-foreground" />
                <code className="min-w-0 flex-1 break-all text-xs">{token}</code>
                <CopyButton text={token} className="size-8 shrink-0" size="icon" variant="ghost" />
            </div>
            <p className="text-muted-foreground text-xs">{t('tokenWarning')}</p>
            <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{t('installTitle')}</span>
                    <CopyButton text={command} className="size-8 shrink-0" size="icon" variant="ghost" />
                </div>
                <pre className="w-full max-w-full overflow-x-auto rounded-lg border bg-muted/40 p-3 text-left text-xs">
                    <code className="whitespace-pre">{command}</code>
                </pre>
                <p className="text-muted-foreground text-xs">{t('installHint')}</p>
            </div>
        </div>
    );
}

'use client';

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { ShieldAlert } from 'lucide-react';
import CopyButton from '@/components/shared/CopyButton';

interface AgentInstallInstructionsProps {
    token: string;
}

export function buildAgentRunCommand(token: string, nexployUrl: string): string {
    return [
        'docker run -d \\',
        '  --name nexploy-agent \\',
        '  --restart unless-stopped \\',
        `  -e NEXPLOY_URL=${nexployUrl} \\`,
        `  -e NEXPLOY_AGENT_TOKEN=${token} \\`,
        '  -v /var/run/docker.sock:/var/run/docker.sock \\',
        '  nexploy/agent:latest',
    ].join('\n');
}

export function AgentInstallInstructions({ token }: AgentInstallInstructionsProps) {
    const t = useTranslations('docker.environmentForm');

    const nexployUrl = typeof window === 'undefined' ? 'https://nexploy.example.com' : window.location.origin;
    const command = buildAgentRunCommand(token, nexployUrl);

    return (
        <div className="space-y-3">
            <p className="text-muted-foreground text-xs">{t('agentInstallDescription')}</p>
            <div className="relative rounded-lg border bg-muted/50 p-3">
                <CopyButton text={command} size="icon" className="absolute top-2 right-2 size-7" />
                <pre className="overflow-x-auto pr-10 font-mono text-xs leading-relaxed">{command}</pre>
            </div>
            <Alert variant="destructive">
                <ShieldAlert />
                <AlertDescription>{t('agentTokenWarning')}</AlertDescription>
            </Alert>
        </div>
    );
}

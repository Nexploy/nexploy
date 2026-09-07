'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { RefreshCw } from 'lucide-react';
import type { DockerAgentInfo } from '@workspace/typescript-interface/docker/agent/agent';
import { regenerateAgentTokenAction } from '@/actions/environment/regenerateAgentToken.action';
import { AgentInstallInstructions } from './AgentInstallInstructions';

interface AgentEnvironmentPanelProps {
    environmentId: string;
}

const POLL_INTERVAL_MS = 5_000;

export function AgentEnvironmentPanel({ environmentId }: AgentEnvironmentPanelProps) {
    const t = useTranslations('docker.environmentForm');
    const [agent, setAgent] = useState<DockerAgentInfo | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const loadAgent = useCallback(async () => {
        const response = await fetch(`/api/environments/${environmentId}/agent`);

        if (!response.ok) return;

        setAgent((await response.json()) as DockerAgentInfo);
    }, [environmentId]);

    useEffect(() => {
        void loadAgent();

        const interval = setInterval(() => void loadAgent(), POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [loadAgent]);

    const { execute, isPending } = useAction(regenerateAgentTokenAction, {
        onSuccess: ({ data }) => {
            if (data) setToken(data.token);
            void loadAgent();
        },
    });

    const isOnline = agent?.status === 'ONLINE';

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t('agentStatus')}</h4>
                <Badge variant={isOnline ? 'default' : 'secondary'}>
                    {isOnline ? t('agentOnline') : t('agentOffline')}
                </Badge>
            </div>

            {agent && (
                <dl className="grid grid-cols-2 gap-2 text-xs">
                    <dt className="text-muted-foreground">{t('agentHostname')}</dt>
                    <dd>{agent.hostname ?? '—'}</dd>
                    <dt className="text-muted-foreground">{t('agentVersion')}</dt>
                    <dd>{agent.version ?? '—'}</dd>
                    <dt className="text-muted-foreground">{t('agentDockerVersion')}</dt>
                    <dd>{agent.dockerVersion ?? '—'}</dd>
                    <dt className="text-muted-foreground">{t('agentPlatform')}</dt>
                    <dd>{agent.platform ? `${agent.platform} / ${agent.architecture ?? '—'}` : '—'}</dd>
                    <dt className="text-muted-foreground">{t('agentLastSeen')}</dt>
                    <dd>{agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString() : '—'}</dd>
                    <dt className="text-muted-foreground">{t('agentTokenPrefix')}</dt>
                    <dd className="font-mono">{agent.tokenPrefix}…</dd>
                </dl>
            )}

            {token ? (
                <AgentInstallInstructions token={token} />
            ) : (
                <div className="space-y-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        isLoading={isPending}
                        disabled={isPending}
                        onClick={() => execute({ environmentId })}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {t('agentRegenerateToken')}
                    </Button>
                    <p className="text-muted-foreground text-xs">{t('agentRegenerateDescription')}</p>
                </div>
            )}
        </div>
    );
}

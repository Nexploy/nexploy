'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { RotateCw } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useTranslations } from 'next-intl';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { onContainerRestartPolicyAction } from '@/actions/docker/container/containerRestartPolicy.action';
import type { ContainerRestartPolicyName } from '@workspace/typescript-interface/docker/docker.container';

const POLICY_OPTIONS: { value: ContainerRestartPolicyName; labelKey: string }[] = [
    { value: 'no', labelKey: 'never' },
    { value: 'always', labelKey: 'always' },
    { value: 'on-failure', labelKey: 'onFailure' },
    { value: 'unless-stopped', labelKey: 'unlessStopped' },
];

export function CardRestartPolicy() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);
    const isSwarmContainer = useContainerStore((state) => !!state.container?.labels?.['com.docker.swarm.service.id']);

    const t = useTranslations('docker.restartPolicy');
    const [pendingPolicy, setPendingPolicy] = useState<ContainerRestartPolicyName | null>(null);
    const { executeAsync, isPending } = useAction(onContainerRestartPolicyAction);

    if (isConnecting) {
        return <Skeleton className={'h-28 flex-1'} />;
    }

    if (!container) return null;

    const currentPolicy = container.restartPolicy?.name ?? 'no';
    const isEditable = !isSwarmContainer && !container.autoRemove;

    const handleChange = async (policy: ContainerRestartPolicyName) => {
        if (policy === currentPolicy) return;

        setPendingPolicy(policy);
        try {
            await executeAsync({ containerId: container.id, policy, maximumRetryCount: 0 });
            toast.success(t('updated'));
        } finally {
            setPendingPolicy(null);
        }
    };

    return (
        <Card>
            <CardHeaderWithIcon icon={RotateCw} title={t('title')} description={t('subtitle')} />
            <CardContent className="flex flex-col gap-2">
                <Select
                    value={pendingPolicy ?? currentPolicy}
                    onValueChange={(value) => handleChange(value as ContainerRestartPolicyName)}
                    disabled={!isEditable || isPending}
                >
                    <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder={t('selectPolicy')} />
                    </SelectTrigger>
                    <SelectContent align="start">
                        <SelectGroup>
                            {POLICY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {t(option.labelKey)}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                    {container.autoRemove ? t('autoRemove') : t(`description.${pendingPolicy ?? currentPolicy}`)}
                </p>
            </CardContent>
        </Card>
    );
}

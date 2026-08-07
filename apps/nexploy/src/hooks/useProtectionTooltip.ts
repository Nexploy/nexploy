'use client';

import { useTranslations } from 'next-intl';
import type { EnvironmentProtectedAction } from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';
import { useEnvironmentProtection } from '@/hooks/useEnvironmentProtection';

export function useProtectionTooltip(action: EnvironmentProtectedAction, environmentId?: string) {
    const t = useTranslations('admin.protection');
    const { environment, isBlocked, isBlockedOn } = useEnvironmentProtection();

    const blocked = environmentId ? isBlockedOn(environmentId, action) : isBlocked(action);

    return {
        blocked,
        tooltip: blocked ? t('blockedTooltip', { name: environment?.name ?? '' }) : undefined,
    };
}

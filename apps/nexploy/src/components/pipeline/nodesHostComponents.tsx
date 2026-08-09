'use client';

import { useAction } from 'next-safe-action/hooks';
import type { ComponentType } from 'react';
import type {
    DnsDomainFieldProps,
    NodeHostComponents,
    PermissionGateProps,
    WebhookSetup,
} from '@nexploy/nodes/ui/adapter';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Can } from '@/components/permission/Can';
import { DnsDomainSelector } from '@/components/domains/DnsDomainSelector';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';

const PermissionGate = Can as unknown as ComponentType<PermissionGateProps>;

function DnsDomainField({ form, basePath }: DnsDomainFieldProps) {
    return <DnsDomainSelector form={form as UseFormReturn<FieldValues>} basePath={basePath} />;
}

export const nodesHostComponents: NodeHostComponents = {
    PermissionGate,
    DnsDomainField,
};

export function useWebhookSetup(onSuccess: () => void): WebhookSetup {
    const { execute, isPending } = useAction(setupWebhookAction, { onSuccess });
    return { execute, isPending };
}

'use client';

import { useAction } from 'next-safe-action/hooks';
import type { ComponentType } from 'react';
import type {
    CloudflareDomainFieldProps,
    NodeHostComponents,
    PermissionGateProps,
    WebhookSetup,
} from '@nexploy/nodes/ui/adapter';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Can } from '@/components/permission/Can';
import { CloudflareDomainSelector } from '@/components/domains/CloudflareDomainSelector';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';

const PermissionGate = Can as unknown as ComponentType<PermissionGateProps>;

function CloudflareDomainField({ form, basePath }: CloudflareDomainFieldProps) {
    return <CloudflareDomainSelector form={form as UseFormReturn<FieldValues>} basePath={basePath} />;
}

export const nodesHostComponents: NodeHostComponents = {
    PermissionGate,
    CloudflareDomainField,
};

export function useWebhookSetup(onSuccess: () => void): WebhookSetup {
    const { execute, isPending } = useAction(setupWebhookAction, { onSuccess });
    return { execute, isPending };
}

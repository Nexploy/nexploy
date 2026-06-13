'use client';

import { useState } from 'react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from '@workspace/ui/components/collapsible';
import { Form } from '@workspace/ui/components/form';
import { ChevronDown, Cloud, Globe, Lock, Plus, Trash2 } from 'lucide-react';
import { manageDomains } from '@/actions/repository/manageDomains.action';
import { deleteDomain } from '@/actions/repository/deleteDomain.action';
import { cn } from '@workspace/ui/lib/utils';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { toast } from 'sonner';
import Link from 'next/link';
import { DomainFields } from '@/components/repositories/tabs/domains/DomainFields';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { CloudflareAccountInfo } from '@workspace/typescript-interface/cloudflare/cloudflare';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface CertOption {
    id: string;
    name: string;
    type: 'LETS_ENCRYPT' | 'CUSTOM';
    domain: string;
}

interface RepositoryDomainsProps {
    repositoryId: string;
    domainsConfig: Domain[];
    cloudflareAccounts: CloudflareAccountInfo[];
    certificates: CertOption[];
}

const DEFAULT_NEW_DOMAIN: Partial<Domain> = {
    host: '',
    path: '/',
    internalPath: '/',
    stripPath: false,
    containerPort: 3000,
    https: false,
    certificateId: undefined,
    environmentId: undefined,
    cloudflareZoneId: undefined,
    cloudflareZoneName: undefined,
};

export function RepositoryDomains({
    repositoryId,
    domainsConfig,
    cloudflareAccounts,
    certificates,
}: RepositoryDomainsProps) {
    const router = useRouter();
    const t = useTranslations('repository.settings.domains');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const bindManageDomains = manageDomains.bind(null, repositoryId);
    const bindDeleteDomain = deleteDomain.bind(null, repositoryId);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        bindManageDomains,
        zodResolver(domainsFormSchema),
        {
            formProps: {
                defaultValues: {
                    domains: domainsConfig,
                    deletedIds: [],
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success(t('updated'));
                    setExpandedIds(new Set());
                    router.refresh();
                    form.reset({
                        domains: data,
                        deletedIds: [],
                    });
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';
    const domains = form.watch('domains');

    const handleAddNew = () => {
        const currentDomains = form.getValues('domains');
        form.setValue('domains', [...currentDomains, DEFAULT_NEW_DOMAIN as Domain], {
            shouldDirty: true,
        });
    };

    const handleRemoveNew = (index: number) => {
        const currentDomains = form.getValues('domains');
        form.setValue(
            'domains',
            currentDomains.filter((_, i) => i !== index),
            { shouldDirty: true },
        );
    };

    const confirmRemoveExisting = (domain: Domain, index: number) => {
        const host = domain.host || t('newDomain');
        openAlertDialog({
            title: t('removeTitle'),
            description: t('removeDescription', { host }),
            cancelLabel: t('cancel'),
            actionLabel: t('remove'),
            onAction: async () => {
                const result = await bindDeleteDomain({ domainId: domain.id! });
                if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                }
                const currentDomains = form.getValues('domains');
                form.setValue(
                    'domains',
                    currentDomains.filter((_, i) => i !== index),
                    { shouldDirty: false },
                );
                toast.success(t('removeSuccess'));
                router.refresh();
            },
        });
    };

    const toggleExpanded = (index: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            const id = `domain-${index}`;
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const hasNewDomains = domains.some((d) => !d.id);
    const newDomainsValid = domains
        .filter((d) => !d.id)
        .every((d) => d.host && d.host.trim() !== '');

    const hasEditedDomains = domains
        .filter((d) => !!d.id)
        .some((d) => {
            const original = domainsConfig.find((o) => o.id === d.id);
            if (!original) return true;
            return (
                d.host !== original.host ||
                d.path !== original.path ||
                d.internalPath !== original.internalPath ||
                d.stripPath !== original.stripPath ||
                d.containerPort !== original.containerPort ||
                d.https !== original.https ||
                d.certificateId !== original.certificateId ||
                d.environmentId !== original.environmentId ||
                d.cloudflareZoneId !== original.cloudflareZoneId
            );
        });

    const hasChanges = (hasNewDomains && newDomainsValid) || hasEditedDomains;

    return (
        <Card className="mx-5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardHeaderWithIcon
                        as={'div'}
                        icon={Globe}
                        title={t('title')}
                        description={t('description')}
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleSubmitWithAction}
                            disabled={isSubmitting || !hasChanges}
                            isLoading={isSubmitting}
                        >
                            {t('save')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleAddNew}>
                            <Plus />
                            {t('add')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction}>
                        {domains.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center text-sm">
                                {t('noDomains')}
                            </div>
                        ) : (
                            <div className={'flex flex-col gap-4'}>
                                {domains.map((domain, index) => {
                                    const isNew = !domain.id;
                                    const isExpanded = expandedIds.has(`domain-${index}`);

                                    return (
                                        <Collapsible
                                            key={domain.id || `new-${index}`}
                                            open={isExpanded || isNew}
                                            onOpenChange={() => !isNew && toggleExpanded(index)}
                                        >
                                            <div
                                                className={cn(
                                                    'rounded-lg border',
                                                    isNew && 'border-dashed',
                                                )}
                                            >
                                                {!isNew && (
                                                    <CollapsibleTrigger asChild>
                                                        <div className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-3">
                                                            <code className="flex items-center gap-2">
                                                                {domain.cloudflareDnsRecordId ? (
                                                                    <Cloud className="size-4 text-orange-500" />
                                                                ) : domain.https ? (
                                                                    <Lock className="size-4 text-green-500" />
                                                                ) : (
                                                                    <Globe className="text-muted-foreground size-4" />
                                                                )}
                                                                <Link
                                                                    onClick={(e) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                    href={`${domain.https ? 'https://' : 'http://'}${domain.host}${
                                                                        domain.path !== '/'
                                                                            ? domain.path
                                                                            : ''
                                                                    }`}
                                                                    className="text-sm font-medium hover:underline"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {domain.https
                                                                        ? 'https://'
                                                                        : 'http://'}
                                                                    {domain.host}
                                                                    {domain.path !== '/' &&
                                                                        domain.path}
                                                                </Link>
                                                                <span className="text-muted-foreground text-sm">
                                                                    → :{domain.containerPort}
                                                                    {domain.internalPath}
                                                                </span>
                                                            </code>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        confirmRemoveExisting(
                                                                            domain as Domain,
                                                                            index,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Trash2 className="text-destructive size-4" />
                                                                </Button>
                                                                <ChevronDown
                                                                    className={cn(
                                                                        'size-4 transition-transform',
                                                                        isExpanded && 'rotate-180',
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </CollapsibleTrigger>
                                                )}
                                                {isNew && (
                                                    <div className="flex items-center justify-between p-3">
                                                        <span className="text-muted-foreground text-sm font-medium">
                                                            {t('newDomain')}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveNew(index)}
                                                        >
                                                            <Trash2 className="text-destructive size-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                                <CollapsibleContent>
                                                    <DomainFields
                                                        form={form}
                                                        index={index}
                                                        cloudflareAccounts={cloudflareAccounts}
                                                        certificates={certificates}
                                                    />
                                                </CollapsibleContent>
                                            </div>
                                        </Collapsible>
                                    );
                                })}
                            </div>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

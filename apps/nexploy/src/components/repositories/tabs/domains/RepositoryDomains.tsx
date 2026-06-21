'use client';

import { useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Cloud, Globe, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { deleteDomain } from '@/actions/repository/deleteDomain.action';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { toast } from 'sonner';
import Link from 'next/link';
import { DomainForm } from '@/components/repositories/tabs/domains/DomainForm';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { CloudflareAccountInfo } from '@workspace/typescript-interface/cloudflare/cloudflare';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { usePipelineStage } from '@/hooks/pipeline/usePipelineStage.ts';

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

export function RepositoryDomains({
    repositoryId,
    domainsConfig,
    cloudflareAccounts,
    certificates,
}: RepositoryDomainsProps) {
    const router = useRouter();
    const t = useTranslations('repository.settings.domains');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const { stageId, stages } = usePipelineStage(repositoryId);
    const isProdStage = !!stages.find((s) => s.id === stageId)?.isProduction;

    const stageDomains = useMemo(
        () => domainsConfig.filter((d) => d.stageId === stageId || (!d.stageId && isProdStage)),
        [domainsConfig, stageId, isProdStage],
    );

    const bindDeleteDomain = deleteDomain.bind(null, repositoryId);

    const handleAddNew = () => {
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            props: {
                className: 'md:max-w-[700px]',
            },
            content: (
                <DomainForm
                    repositoryId={repositoryId}
                    stageId={stageId}
                    cloudflareAccounts={cloudflareAccounts}
                    certificates={certificates}
                />
            ),
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    const handleEdit = (domain: Domain) => {
        openDialog({
            title: t('editTitle'),
            description: t('editDescription', { host: domain.host }),
            content: (
                <DomainForm
                    repositoryId={repositoryId}
                    domain={domain}
                    stageId={stageId}
                    cloudflareAccounts={cloudflareAccounts}
                    certificates={certificates}
                />
            ),
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    const confirmRemove = (domain: Domain) => {
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
                toast.success(t('removeSuccess'));
                router.refresh();
            },
        });
    };

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
                    <Button size="sm" onClick={handleAddNew}>
                        <Plus />
                        {t('add')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {stageDomains.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                        {t('noDomains')}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {stageDomains.map((domain) => (
                            <div
                                key={domain.id}
                                className="group flex items-center justify-between rounded-lg border p-3 transition-colors"
                            >
                                <code className="flex min-w-0 items-center gap-2">
                                    {domain.cloudflareDnsRecordId ? (
                                        <Cloud className="size-4 shrink-0 text-orange-500" />
                                    ) : domain.https ? (
                                        <Lock className="size-4 shrink-0 text-green-500" />
                                    ) : (
                                        <Globe className="text-muted-foreground size-4 shrink-0" />
                                    )}
                                    <Link
                                        href={`${domain.https ? 'https://' : 'http://'}${domain.host}${
                                            domain.path !== '/' ? domain.path : ''
                                        }`}
                                        className="truncate text-sm font-medium hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {domain.https ? 'https://' : 'http://'}
                                        {domain.host}
                                        {domain.path !== '/' && domain.path}
                                    </Link>
                                    <span className="text-muted-foreground shrink-0 text-sm">
                                        → :{domain.containerPort}
                                        {domain.internalPath}
                                    </span>
                                </code>
                                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={'size-8'}
                                        onClick={() => handleEdit(domain)}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={'size-8'}
                                        onClick={() => confirmRemove(domain)}
                                    >
                                        <Trash2 className="text-destructive size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

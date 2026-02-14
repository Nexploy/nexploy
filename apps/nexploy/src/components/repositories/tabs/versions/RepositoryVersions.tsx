'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Check, Clock, GitBranch, GitCommit, Loader2, Rocket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Separator } from '@workspace/ui/components/separator';
import { onDeployVersion } from '@/actions/repository/builds/deployVersion.action';
import { onDeleteVersion } from '@/actions/repository/builds/deleteVersion.action';
import { Badge } from '@workspace/ui/components/badge';
import { Version } from '@workspace/typescript-interface/docker/docker.version';
import { useTranslations } from 'next-intl';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface RepositoryVersionsProps {
    repositoryId: string;
    containerImageUsed?: string;
    versions: Version[];
}

export function RepositoryVersions({
    repositoryId,
    versions,
    containerImageUsed,
}: RepositoryVersionsProps) {
    const t = useTranslations('repository.versions');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { execute: executeDeploy, isPending: isDeployPending } = useAction(onDeployVersion, {
        onSuccess: () => {
            toast.success(t('deploySuccess'));
            router.refresh();
        },
    });

    const { executeAsync: executeDeleteAsync } = useAction(onDeleteVersion, {
        onSuccess: () => {
            toast.success(t('deleteSuccess'));
            router.refresh();
        },
    });

    const handleDeploy = (imageTag: string) => {
        executeDeploy({ imageTag, repositoryId });
    };

    const handleDelete = (imageTag: string) => {
        openAlertDialog({
            title: t('deleteTitle'),
            description: t('confirmDelete'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('delete'),
            onAction: async () => {
                await executeDeleteAsync({ imageTag, repositoryId });
            },
        });
    };

    const isCurrentVersion = (version: Version) => {
        const currentTag = containerImageUsed?.split(':')[1];
        return currentTag === version.imageTag || currentTag === version.buildId;
    };

    return (
        <div className="flex flex-col gap-4 px-5">
            <h2 className="text-xl font-semibold">{t('title')}</h2>
            <div className="rounded-md border">
                {versions.length === 0 ? (
                    <div className="text-muted-foreground p-8 text-center text-sm">
                        {t('noVersions')}
                    </div>
                ) : (
                    <div className="divide-y">
                        {versions.map((version, index) => {
                            const isCurrent = isCurrentVersion(version);
                            return (
                                <div
                                    key={version.imageId}
                                    className={`flex items-center justify-between gap-4 p-3`}
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={isCurrent ? 'default' : 'secondary'}
                                                className="font-mono text-xs"
                                            >
                                                v{versions.length - index}
                                            </Badge>
                                            <span className="line-clamp-1 text-sm font-medium">
                                                {version.commitMessage ??
                                                    `Build #${version.imageTag}`}
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {dayjs(version.createdAt).format(
                                                    'DD/MM/YYYY HH:mm:ss',
                                                )}
                                            </span>
                                            {version.commitHash && (
                                                <>
                                                    <Separator
                                                        orientation="vertical"
                                                        className="!h-3 w-1"
                                                    />
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <GitCommit className="size-3" />
                                                        {version.commitHash}
                                                    </span>
                                                </>
                                            )}
                                            {version.branch && (
                                                <>
                                                    <Separator
                                                        orientation="vertical"
                                                        className="!h-3 w-1"
                                                    />
                                                    <span className="flex items-center gap-1">
                                                        <GitBranch className="size-3" />
                                                        {version.branch}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant={isCurrent ? 'secondary' : 'outline'}
                                            onClick={() => handleDeploy(version.imageTag)}
                                            disabled={isDeployPending || isCurrent}
                                        >
                                            {isDeployPending ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : isCurrent ? (
                                                <Check className="size-4" />
                                            ) : (
                                                <Rocket className="size-4" />
                                            )}
                                            {isCurrent ? t('deployed') : t('deploy')}
                                        </Button>
                                        <Button
                                            size={'sm'}
                                            variant="outline"
                                            disabled={isCurrent}
                                            onClick={() => handleDelete(version.imageTag)}
                                        >
                                            <Trash2 className={'text-destructive'} />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

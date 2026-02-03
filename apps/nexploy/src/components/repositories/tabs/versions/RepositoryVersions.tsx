'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Check, Clock, GitBranch, GitCommit, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Build } from 'generated/client';
import { Separator } from '@workspace/ui/components/separator';
import { onDeployVersion } from '@/actions/repository/builds/deployVersion.action';
import { Badge } from '@workspace/ui/components/badge';
import { Image } from '@workspace/typescript-interface/docker/docker.image';
import { useTranslations } from 'next-intl';

interface RepositoryVersionsProps {
    repositoryId: string;
    containerImageUsed?: string;
    versions: Build[];
    images: Pick<Image, 'name' | 'tag'>[];
}

export function RepositoryVersions({
    repositoryId,
    versions,
    images,
    containerImageUsed,
}: RepositoryVersionsProps) {
    const t = useTranslations('repository.versions');
    const router = useRouter();

    const { execute, isPending } = useAction(onDeployVersion, {
        onSuccess: () => {
            toast.success(t('deploySuccess'));
            router.refresh();
        },
    });

    const handleDeploy = (buildId: string) => {
        execute({ buildId, repositoryId });
    };

    const deployedTags = images.flatMap((img) => img.tag);
    const deployedVersions = deployedTags
        .map((tag) => {
            return versions.find((v) => v.id === tag || tag.includes(v.id) || v.id.includes(tag));
        })
        .filter((v): v is Build => v !== undefined)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const isCurrentVersion = (buildId: string) => buildId === containerImageUsed?.split(':')[1];

    return (
        <div className="flex flex-col gap-4 px-5">
            <h2 className="text-xl font-semibold">{t('title')}</h2>
            <div className="rounded-md border">
                {deployedVersions.length === 0 ? (
                    <div className="text-muted-foreground p-8 text-center text-sm">
                        {t('noVersions')}
                    </div>
                ) : (
                    <div className="divide-y">
                        {deployedVersions.map((version, index) => {
                            const isCurrent = isCurrentVersion(version.id);
                            return (
                                <div
                                    key={version.id}
                                    className={`flex items-center justify-between gap-4 p-4`}
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={isCurrent ? 'default' : 'secondary'}
                                                className="font-mono text-xs"
                                            >
                                                v{deployedVersions.length - index}
                                            </Badge>
                                            <span className="line-clamp-1 text-sm font-medium">
                                                {version.commitMessage ??
                                                    `Build #${version.id.slice(-8)}`}
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {dayjs(version.createdAt).format(
                                                    'DD/MM/YYYY HH:mm',
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
                                                        {version.commitHash.slice(0, 7)}
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
                                    <Button
                                        size="sm"
                                        variant={isCurrent ? 'secondary' : 'outline'}
                                        onClick={() => handleDeploy(version.id)}
                                        disabled={isPending || isCurrent}
                                    >
                                        {isPending ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : isCurrent ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <Rocket className="size-4" />
                                        )}
                                        {isCurrent ? t('deployed') : t('deploy')}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

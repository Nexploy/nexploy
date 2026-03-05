'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Check, Clock, GitBranch, GitCommit, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Separator } from '@workspace/ui/components/separator';
import {
    onDeployComposeVersion,
    onDeployDockerfileVersion,
} from '@/actions/repository/versions/deployVersion.action';
import { Badge } from '@workspace/ui/components/badge';
import { Version } from '@workspace/typescript-interface/docker/docker.version';
import { useTranslations } from 'next-intl';

interface RepositoryVersionsProps {
    repositoryId: string;
    /** Map of environmentId (or '' for legacy/null) → full image string used by the running container */
    deployedImageByEnvironment: Record<string, string>;
    versions: Version[];
}

export function RepositoryVersions({
    repositoryId,
    versions,
    deployedImageByEnvironment,
}: RepositoryVersionsProps) {
    const t = useTranslations('repository.versions');
    const tBuilds = useTranslations('repository.builds');
    const router = useRouter();

    const [deployingImageTags, setDeployingImageTags] = useState<Set<string>>(new Set());

    const handleDeploy = async (imageTag: string, buildType: string, environmentId?: string) => {
        setDeployingImageTags((prev) => new Set([...prev, imageTag]));
        try {
            const action =
                buildType === 'DOCKER_COMPOSE' ? onDeployComposeVersion : onDeployDockerfileVersion;
            const result = await action({ imageTag, repositoryId, environmentId });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(t('deploySuccess'));
                router.refresh();
            }
        } finally {
            setDeployingImageTags((prev) => {
                const next = new Set(prev);
                next.delete(imageTag);
                return next;
            });
        }
    };

    const isCurrentVersion = (version: Version) => {
        const envKey = version.environmentId ?? '';
        const containerImageUsed = deployedImageByEnvironment[envKey];
        if (!containerImageUsed) return false;
        const currentTag = containerImageUsed.split(':').at(-1) ?? '';
        return currentTag === version.imageTag;
    };

    const groups = versions.reduce<Map<string | undefined, { name: string; versions: Version[] }>>(
        (acc, version) => {
            const key = version.environmentId ?? undefined;
            if (!acc.has(key)) {
                acc.set(key, {
                    name: version.environmentName ?? tBuilds('noEnvironment'),
                    versions: [],
                });
            }
            acc.get(key)!.versions.push(version);
            return acc;
        },
        new Map(),
    );

    const renderVersion = (version: Version) => {
        const isCurrent = isCurrentVersion(version);
        return (
            <div
                key={`${version.repositoryId}-${version.imageTag}`}
                className={`flex items-center justify-between gap-4 p-3`}
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={isCurrent ? 'default' : 'secondary'}
                            className="font-mono text-xs"
                        >
                            v{version.versionNumber}
                        </Badge>
                        <span className="line-clamp-1 text-sm font-medium">
                            {version.commitMessage ?? `Build #${version.imageTag}`}
                        </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {dayjs(version.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                        </span>
                        {version.commitHash && (
                            <>
                                <Separator orientation="vertical" className="!h-3 w-1" />
                                <span className="flex items-center gap-1 font-mono">
                                    <GitCommit className="size-3" />
                                    {version.commitHash}
                                </span>
                            </>
                        )}
                        {version.branch && (
                            <>
                                <Separator orientation="vertical" className="!h-3 w-1" />
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
                        onClick={() =>
                            handleDeploy(version.imageTag, version.buildType, version.environmentId)
                        }
                        disabled={deployingImageTags.has(version.imageTag) || isCurrent}
                    >
                        {deployingImageTags.has(version.imageTag) ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : isCurrent ? (
                            <Check className="size-4" />
                        ) : (
                            <Rocket className="size-4" />
                        )}
                        {isCurrent ? t('deployed') : t('deploy')}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 px-5">
            <h2 className="text-xl font-semibold">{t('title')}</h2>
            {versions.length === 0 ? (
                <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
                    {t('noVersions')}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {Array.from(groups.entries()).map(([key, group]) => (
                        <div key={key ?? 'none'} className="flex flex-col gap-1">
                            <h3 className="text-muted-foreground px-1 text-sm font-medium">
                                {group.name}
                            </h3>
                            <div className="rounded-md border">
                                <div className="divide-y">{group.versions.map(renderVersion)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

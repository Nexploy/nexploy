'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Check, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { onDeployDockerfileVersion } from '@/actions/repository/versions/deployDockerfileVersion.action';
import { onDeployComposeVersion } from '@/actions/repository/versions/deployComposeVersion.action';
import { useTranslations } from 'next-intl';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore.ts';
import { Version } from '@workspace/typescript-interface/docker/docker.version';

interface VersionDeployButtonProps {
    version: Version;
    repositoryId: string;
    isCurrent: boolean;
}

export function VersionDeployButton({
    version,
    repositoryId,
    isCurrent,
}: VersionDeployButtonProps) {
    const t = useTranslations('repository.versions');
    const router = useRouter();
    const selectedEnvironmentId = useEnvironmentStore((s) => s.selectedEnvironmentId);
    const [isDeploying, setIsDeploying] = useState(false);

    if (version.environmentId !== selectedEnvironmentId) return null;

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            const deployAction = version.hasComposeConfig
                ? onDeployComposeVersion
                : onDeployDockerfileVersion;
            const result = await deployAction({
                imageTag: version.imageTag,
                repositoryId,
                environmentId: version.environmentId,
            });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(t('deploySuccess'));
                router.refresh();
            }
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <Button
            size="sm"
            variant={isCurrent ? 'secondary' : 'outline'}
            onClick={handleDeploy}
            disabled={isDeploying || isCurrent}
        >
            {isDeploying ? (
                <Loader2 className="size-4 animate-spin" />
            ) : isCurrent ? (
                <Check className="size-4" />
            ) : (
                <Rocket className="size-4" />
            )}
            {isCurrent ? t('deployed') : t('deploy')}
        </Button>
    );
}

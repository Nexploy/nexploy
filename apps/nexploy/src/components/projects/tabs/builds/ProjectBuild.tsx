'use client';

import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenDeploymenIdAction } from '@/actions/inngest/tokenDeploymenId';
import Link from 'next/link';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { Badge } from '@workspace/ui/components/badge';
import { Build, BuildStatus } from 'generated/client';

interface BuildLogsProps {
    projectId: string;
    build: Build;
}

const getStatusBadge = (status: BuildStatus) => {
    switch (status) {
        case 'COMPLETED':
            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Success
                </Badge>
            );
        case 'FAILED':
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3" />
                    Failed
                </Badge>
            );
        case 'BUILDING':
            return (
                <Badge variant="warning" className="gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Building
                </Badge>
            );
        case 'QUEUED':
            return (
                <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" />
                    Queued
                </Badge>
            );
    }
};

export function ProjectBuild({ projectId, build }: BuildLogsProps) {
    const { latestData } = useInngestSubscription({
        enabled: build.status !== 'COMPLETED',
        refreshToken: async () => {
            const result = await onGetTokenDeploymenIdAction({
                deploymentId: build.id,
                topics: ['status'],
            });
            return result?.data ?? null;
        },
    });

    return (
        <Link
            href={`/projects/${projectId}/${build.id}`}
            className="hover:bg-muted/50 flex cursor-pointer flex-col justify-center p-3"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    {getStatusBadge(latestData?.data.status ?? build.status)}
                    <span className="text-sm font-medium">#{build.commitHash || build.id}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="size-3" />
                    {dayjs(build.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                </div>
            </div>
        </Link>
    );
}

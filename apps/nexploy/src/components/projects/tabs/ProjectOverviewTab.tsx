'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { CheckCircle2, Clock, GitCommit, Loader2, Terminal, XCircle } from 'lucide-react';
import { BuildLogs } from '@/components/projects/BuildLogs';
import { Button } from '@workspace/ui/components/button';

interface Deployment {
    id: string;
    status: string;
    commitHash: string | null;
    commitMessage: string | null;
    createdAt: Date;
}

interface ProjectOverviewTabProps {
    project: {
        buildType: string;
        dockerfilePath: string | null;
        deployments: Deployment[];
    };
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'SUCCESS':
            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Deployed
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
                <Badge variant="warning" className="animate-pulse gap-1">
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
        default:
            return <Badge variant="outline">Unknown</Badge>;
    }
};

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {project.deployments[0] ? (
                            getStatusBadge(project.deployments[0].status)
                        ) : (
                            <Badge variant="outline">No deployments</Badge>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Build Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.buildType}</div>
                        <p className="text-muted-foreground text-xs">
                            {project.dockerfilePath || 'Standard Build'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Last Deployed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.deployments[0]
                                ? new Date(project.deployments[0].createdAt).toLocaleDateString()
                                : '-'}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {project.deployments[0]
                                ? new Date(project.deployments[0].createdAt).toLocaleTimeString()
                                : 'Never'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold tracking-tight">Recent Deployments</h2>
                <div className="rounded-md border">
                    {project.deployments.length === 0 ? (
                        <div className="text-muted-foreground p-8 text-center">
                            No deployments yet.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {project.deployments.map((deployment) => (
                                <BuildLogs
                                    key={deployment.id}
                                    deploymentId={deployment.id}
                                    jobId={deployment.id}
                                >
                                    {({ openLogs }) => (
                                        <div
                                            onClick={openLogs}
                                            className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(deployment.status)}
                                                        <span className="text-sm font-medium">
                                                            #{deployment.id.slice(-6)}
                                                        </span>
                                                    </div>
                                                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                                        <Clock className="size-3" />
                                                        {new Date(
                                                            deployment.createdAt,
                                                        ).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end gap-1">
                                                    {deployment.commitMessage && (
                                                        <span
                                                            className="max-w-[300px] truncate text-sm"
                                                            title={deployment.commitMessage}
                                                        >
                                                            {deployment.commitMessage}
                                                        </span>
                                                    )}
                                                    {deployment.commitHash && (
                                                        <div className="text-muted-foreground bg-muted flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs">
                                                            <GitCommit className="size-3" />
                                                            {deployment.commitHash.slice(0, 7)}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openLogs();
                                                    }}
                                                >
                                                    <Terminal className="mr-2 size-4" />
                                                    Logs
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </BuildLogs>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

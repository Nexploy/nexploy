import type { Metadata } from 'next';
import { Folder, GitBranch, Github, Gitlab, Rocket } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { AddProject } from '@/components/projects/AddProject';
import { Link } from '@/i18n/navigation';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { getProjectService } from '@/services/project/project.service';

export const metadata: Metadata = {
    title: 'Projects',
    description: 'Gérez vos projets Docker avec Nexploy',
};

const getStatusBadge = (status?: string) => {
    switch (status) {
        case 'SUCCESS':
            return <Badge variant="default">Deployed</Badge>;
        case 'FAILED':
            return <Badge variant="destructive">Failed</Badge>;
        case 'BUILDING':
            return (
                <Badge variant="warning" className="animate-pulse">
                    Building
                </Badge>
            );
        case 'QUEUED':
            return <Badge variant="secondary">Queued</Badge>;
        default:
            return <Badge variant="outline">No deploys</Badge>;
    }
};

const getGitIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('github')) return Github;
    if (p.includes('gitlab')) return Gitlab;
    return GitBranch;
};

export default async function ProjectsPage() {
    const projects = await getProjectService();

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-4 overflow-hidden">
                <div className="flex justify-between gap-2 px-5">
                    <div className={'flex gap-3'}>
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Folder className="text-primary size-7" />
                        </div>
                        <div className={'flex flex-col'}>
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                Projects
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Gérez et organisez vos projets Nexploy
                            </p>
                        </div>
                    </div>
                    <AddProject />
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'px-5 pt-1 pb-5'}>
                        {projects.length === 0 ? (
                            <Empty className={'mt-24'}>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon" className="bg-primary/10">
                                        <Folder className="text-primary" />
                                    </EmptyMedia>
                                    <EmptyTitle>Aucun projet</EmptyTitle>
                                    <EmptyDescription>
                                        Créez votre premier projet pour commencer.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => {
                                    const lastDeployment = project.build?.[0];
                                    const Icon = getGitIcon(project.gitProvider);

                                    return (
                                        <Link href={`/projects/${project.id}`} key={project.id}>
                                            <Card className="group border-muted-foreground/20 bg-background relative flex flex-col overflow-hidden p-4 px-0 !pb-0 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
                                                <CardHeader className="flex flex-row items-start justify-between px-4">
                                                    <div className="flex w-full items-center gap-3">
                                                        <div className="bg-secondary/50 text-secondary-foreground ring-border group-hover:bg-primary/10 group-hover:text-primary flex size-10 items-center justify-center rounded-full ring-1 transition-colors">
                                                            <Icon className="size-5" />
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                            <CardTitle className="text-base leading-none font-semibold">
                                                                {project.name}
                                                            </CardTitle>
                                                            <CardDescription className="text-muted-foreground/80 flex items-center gap-1 truncate font-mono text-xs">
                                                                <GitBranch className="size-3" />
                                                                <span className="font-mono">
                                                                    {project.branch}
                                                                </span>
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardFooter className="bg-muted/40 text-muted-foreground flex h-14 justify-between border-t !p-4 text-xs">
                                                    {getStatusBadge(lastDeployment?.status)}
                                                    <Button size={'icon'} variant={'secondary'}>
                                                        <Rocket />
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

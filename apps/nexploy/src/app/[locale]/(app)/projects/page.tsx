import type { Metadata } from 'next';
import { Folder, FolderOpen, GitBranch, Github } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { AddProject } from '@/components/projects/AddProject';
import { getProjectService } from '@/services/project/getProjectService';
import { Link } from '@/i18n/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';

export const metadata: Metadata = {
    title: 'Projects',
    description: 'Gérez vos projets Docker avec Nexploy',
};

export default async function ProjectsPage() {
    const projects = await getProjectService();

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
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
                    <div className={'px-5 pb-6'}>
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <Link href={`/projects/${project.id}`} key={project.id}>
                                        <Card className="hover:bg-accent/50 transition-colors">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                                                        <FolderOpen className="text-primary size-5" />
                                                    </div>
                                                </div>
                                                <CardTitle className="mt-4">
                                                    {project.name}
                                                </CardTitle>
                                                <CardDescription className="line-clamp-1">
                                                    {project.repositoryUrl}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Github className="size-4" />
                                                        <span className="capitalize">
                                                            {project.gitProvider.toLowerCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <GitBranch className="size-4" />
                                                        <span>{project.branch}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

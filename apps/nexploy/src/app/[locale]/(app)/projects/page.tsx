import type { Metadata } from 'next';
import { Folder } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';

export const metadata: Metadata = {
    title: 'Projects',
    description: 'Gérez vos projets Docker avec Nexploy',
};

import { AddProject } from '@/components/projects/AddProject';

export default function ProjectsPage() {
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
                    <div className={'pb-6'}>
                        <Empty className="mx-5 mt-8">
                            <EmptyHeader>
                                <EmptyMedia variant="icon" className="bg-primary/10">
                                    <Folder className="text-primary" />
                                </EmptyMedia>
                                <EmptyTitle>Aucun projet</EmptyTitle>
                                <EmptyDescription>
                                    Créez votre premier projet pour commencer.
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                {/* Actions à venir (créer un projet, importer, etc.) */}
                            </EmptyContent>
                        </Empty>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

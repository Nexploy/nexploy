import type { Metadata } from 'next';
import { FolderGit2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { AddRepository } from '@/components/repositories/AddRepository';
import { getRepositories } from '@/services/repository.service';
import { getTranslations } from 'next-intl/server';
import { RepositoriesGrid } from '@/components/repositories/RepositoriesGrid';

export const metadata: Metadata = {
    title: 'Repositories',
    description: 'Manage your Docker repositories',
};

export default async function RepositoriesPage() {
    const [repositories, t] = await Promise.all([getRepositories(), getTranslations('repository')]);

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4 overflow-hidden">
                <div className="flex justify-between gap-2 px-5">
                    <div className={'flex gap-3'}>
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <FolderGit2 className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
                            <p className="text-muted-foreground text-sm">
                                {t('manageRepositories')}
                            </p>
                        </div>
                    </div>
                    <AddRepository />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'px-5 pt-1 pb-5'}>
                        <RepositoriesGrid repositories={repositories} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

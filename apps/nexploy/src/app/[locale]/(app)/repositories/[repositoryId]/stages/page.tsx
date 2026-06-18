import { notFound } from 'next/navigation';
import { Info, Layers } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getRepositorieById } from '@/services/repository.service';
import { StageList } from '@/components/repositories/stages/StageList';
import { AddStageButton } from '@/components/repositories/stages/AddStageButton';
import { BackButton } from '@/components/shared/BackButton';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';

interface StagesPageProps {
    params: Promise<{ repositoryId: string }>;
}

export default async function RepositoryStagesPage({ params }: StagesPageProps) {
    const { repositoryId } = await params;
    const repository = await getRepositorieById(repositoryId);
    if (!repository) notFound();

    const t = await getTranslations('repository.stages');

    return (
        <BreadcrumbProvider segments={{ repositoryId: repository.name }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Layers className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {t('manageTitle')}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {t('manageDescription')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 flex gap-3">
                        <BackButton />
                        <AddStageButton repositoryId={repositoryId} />
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        <div className="border-primary/20 bg-primary/5 flex gap-3 rounded-lg border p-4">
                            <Info className="text-primary mt-0.5 size-5 shrink-0" />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{t('infoTitle')}</span>
                                <span className="text-muted-foreground text-sm leading-relaxed">
                                    {t('infoDescription')}
                                </span>
                            </div>
                        </div>
                        <StageList repositoryId={repositoryId} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}

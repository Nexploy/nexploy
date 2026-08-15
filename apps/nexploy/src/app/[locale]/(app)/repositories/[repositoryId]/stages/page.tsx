import { notFound } from 'next/navigation';
import { Info, Layers } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getRepositorieById } from '@/services/repository.service';
import { getStagesByRepository } from '@/services/repository/deploymentStage.service';
import { StageList } from '@/components/repositories/stages/StageList';
import { AddStageButton } from '@/components/repositories/stages/AddStageButton';
import { BackButton } from '@/components/shared/BackButton';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert.tsx';

interface StagesPageProps {
    params: Promise<{ repositoryId: string }>;
}

export default async function RepositoryStagesPage({ params }: StagesPageProps) {
    const { repositoryId } = await params;
    const repository = await getRepositorieById(repositoryId);
    if (!repository) notFound();

    const stages = await getStagesByRepository(repositoryId);

    const t = await getTranslations('repository.stages');

    return (
        <BreadcrumbProvider segments={{ repositoryId: repository.name }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Layers className="size-7 text-primary" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="break-all font-semibold text-3xl tracking-tight">{t('manageTitle')}</h1>
                            <p className="text-muted-foreground text-sm">{t('manageDescription')}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex gap-3">
                        <BackButton />
                        <AddStageButton repositoryId={repositoryId} />
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        <Alert variant="info">
                            <Info />
                            <AlertTitle>{t('infoTitle')}</AlertTitle>
                            <AlertDescription>{t('infoDescription')}</AlertDescription>
                        </Alert>
                        <StageList repositoryId={repositoryId} stages={stages} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}

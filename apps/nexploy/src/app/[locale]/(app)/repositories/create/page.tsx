'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Folder, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { repositoryCreateFormSchema } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { onRepositoryCreateAction } from '@/actions/repository/repositoryCreate.action';
import { GitSourceStep } from '@/components/repositories/steps/GitSourceStep';
import { useTranslations } from 'next-intl';

export default function AddRepositoryPage() {
    const t = useTranslations('repository.create');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onRepositoryCreateAction,
        zodResolver(repositoryCreateFormSchema),
        {
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) router.push(`/repositories/${data}`);
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex justify-between gap-4 px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Folder className="text-primary size-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        icon={ArrowLeft}
                        onClick={router.back}
                        disabled={isSubmitting}
                    >
                        {t('back')}
                    </Button>
                    <Button
                        type="submit"
                        icon={Plus}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleSubmitWithAction}
                    >
                        {isSubmitting ? t('adding') : t('addRepository')}
                    </Button>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <div className="space-y-5 px-5 pb-5">
                        <GitSourceStep />
                    </div>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}

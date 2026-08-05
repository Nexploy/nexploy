import { ScrollText } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { ActivitySection } from '@/components/admin/activity/ActivitySection';
import { SSEProvider } from '@/providers/SSEProviders.tsx';

export const metadata: Metadata = {
    title: 'Activity',
    description: 'Audit trail of every action performed on this instance',
};

export default async function ActivityPage() {
    const t = await getTranslations('admin.activity');

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex h-full flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <ScrollText className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">{t('title')}</h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-5 px-5 pb-5">
                        <SSEProvider connections={['activity']}>
                            <ActivitySection />
                        </SSEProvider>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

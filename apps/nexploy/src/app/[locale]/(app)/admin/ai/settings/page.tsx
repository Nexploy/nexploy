import { SlidersHorizontal } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getAISettings } from '@/services/aiSettings.service';
import { AISettingsSection } from '@/components/admin/ai/AISettingsSection';

export const metadata: Metadata = {
    title: 'AI Settings',
    description: 'Configure AI assistant behavior',
};

export default async function AISettingsPage() {
    const [t, aiSettings] = await Promise.all([
        getTranslations('ai.admin.settings'),
        getAISettings(),
    ]);

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <SlidersHorizontal className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight break-all">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-3 px-5 pb-5">
                        <AISettingsSection
                            requireDestructiveConfirmation={
                                aiSettings.requireDestructiveConfirmation
                            }
                        />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

import { ShieldLock } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getUserSession } from '@/services/auth/auth.service';
import { listEnvironmentProtections } from '@/services/environment/environmentProtection.service';
import { EnvironmentProtectionSection } from '@/components/admin/protection/EnvironmentProtectionSection';
import { hasPermission } from '@/lib/auth/permissions';

export const metadata: Metadata = {
    title: 'Environment protection',
    description: 'Block sensitive Docker actions on protected environments',
};

export default async function EnvironmentProtectionPage() {
    const t = await getTranslations('admin.protection');
    const session = await getUserSession();

    if (!session) notFound();

    const role = session.user.role as string;

    if (!hasPermission(role, 'environment', 'read')) notFound();

    const environments = await listEnvironmentProtections();
    const canManage = hasPermission(role, 'environment', 'update');

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex h-full flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <ShieldLock className="size-7 text-primary" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-5 px-5 pb-5">
                        <EnvironmentProtectionSection environments={environments} canManage={canManage} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

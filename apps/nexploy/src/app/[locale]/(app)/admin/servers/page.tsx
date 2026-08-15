import { Server } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { AddBuildRunnerButton } from '@/components/admin/servers/AddBuildRunnerButton';
import { BuildRunnerSection } from '@/components/admin/servers/BuildRunnerSection';
import { getUserSession } from '@/services/auth/auth.service';
import { getBuildRunners } from '@/services/buildRunner.service';
import { hasPermission } from '@/lib/auth/permissions';

export const metadata: Metadata = {
    title: 'Servers',
    description: 'Connect remote build servers so production hosts stay free during builds',
};

export default async function ServersPage() {
    const t = await getTranslations('admin.buildRunners');
    const session = await getUserSession();

    if (!session) notFound();

    const role = session.user.role as string;

    if (!hasPermission(role, 'buildRunner', 'read')) notFound();

    const runners = await getBuildRunners();
    const serverUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXPLOY_URL ?? 'http://localhost:3000';

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex h-full flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Server className="size-7 text-primary" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                    <AddBuildRunnerButton serverUrl={serverUrl} />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-5 px-5 pb-5">
                        <BuildRunnerSection runners={runners} serverUrl={serverUrl} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

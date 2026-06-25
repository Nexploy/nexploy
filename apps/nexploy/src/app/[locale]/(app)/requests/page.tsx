'use client';

import { Send } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useRequestsStore } from '@/stores/traefik/useRequestsStore';
import { SSEProvider } from '@/providers/SSEProviders';
import { useTranslations } from 'next-intl';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore.ts';
import { TableRequests } from '@/components/traefik/table/TableRequests';

export default function RequestsPage() {
    const t = useTranslations('requests');

    const environments = useEnvironmentStore((s) => s.environments);
    const defaultLocalEnvironment = environments.find((env) => env.isDefault);

    const requests = useRequestsStore((s) => s.requests);
    const lastUpdate = useRequestsStore((s) => s.lastUpdate);

    const isLoading = !lastUpdate;

    const getRequestsStatusText = () => {
        if (isLoading) {
            return t('waitingForRequests');
        }
        if (requests.length === 0) {
            return t('noRequests');
        }
        return t('requestsCaptured', { count: requests.length });
    };

    return (
        <SSEProvider
            connections={['traefik']}
            params={{ traefik: { environmentId: defaultLocalEnvironment?.id } }}
        >
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Send className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{getRequestsStatusText()}</p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="pt-1 pb-5">
                        <TableRequests />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </SSEProvider>
    );
}

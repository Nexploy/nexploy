'use client';

import { useLocalStorage } from 'usehooks-ts';
import { SSEProvider } from '@/providers/SSEProviders';
import { MonitoringHeader } from '@/components/monitoring/MonitoringHeader';
import { MonitoringTabs } from '@/components/monitoring/MonitoringTabs';

export function MonitoringPage() {
    const [refreshRate] = useLocalStorage('stats-refreshRate', '5000');

    return (
        <SSEProvider
            connections={['monitoring', 'containersStats']}
            params={{
                monitoring: { refreshRate },
                containersStats: { refreshRate },
            }}
        >
            <div className="flex h-full flex-1 flex-col gap-5">
                <MonitoringHeader />
                <MonitoringTabs />
            </div>
        </SSEProvider>
    );
}

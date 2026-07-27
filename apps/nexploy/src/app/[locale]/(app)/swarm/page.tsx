import { SwarmPage } from '@/components/swarm/SwarmPage';
import { SSEProvider } from '@/providers/SSEProviders';

export default function SwarmRoutePage() {
    return (
        <SSEProvider connections={['swarm']}>
            <SwarmPage />
        </SSEProvider>
    );
}

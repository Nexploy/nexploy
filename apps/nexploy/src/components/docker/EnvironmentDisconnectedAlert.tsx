'use client';

import { useDockerStore } from '@/stores/docker/useDockerStore';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { AlertCircle } from 'lucide-react';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';

export function EnvironmentDisconnectedAlert() {
    const environmentStatus = useDockerStore((state) => state.environmentStatus);
    const getSelectedEnvironment = useEnvironmentStore((state) => state.getSelectedEnvironment);
    const selectedEnv = getSelectedEnvironment();

    if (environmentStatus !== 'disconnected') {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Environment Not Connected</AlertTitle>
            <AlertDescription>
                The environment <strong>{selectedEnv?.name || 'Unknown'}</strong> is not connected
                or unavailable. The Docker daemon may be unreachable or the environment may not be
                registered on the docker-api service.
                <br />
                <br />
                Please check:
                <ul className="mt-2 list-inside list-disc">
                    <li>The Docker daemon is running for this environment</li>
                    <li>The docker-api service can reach the Docker daemon</li>
                    <li>Switch to another environment to continue working</li>
                </ul>
            </AlertDescription>
        </Alert>
    );
}

'use client';

import { Button } from '@workspace/ui/components/button';
import { Network } from 'lucide-react';

export function SwarmNotActive() {
    return (
        <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
                <Network className="text-muted-foreground mx-auto mb-4 size-16" />
                <h2 className="mb-2 text-2xl font-semibold">Swarm Mode Not Active</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                    This Docker daemon is not part of a swarm. Initialize a new swarm or join an
                    existing one to manage distributed services.
                </p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" disabled>
                        Initialize Swarm
                    </Button>
                    <Button variant="outline" disabled>
                        Join Swarm
                    </Button>
                </div>
                <p className="text-muted-foreground mt-4 text-xs">
                    Use <code className="bg-muted rounded px-1">docker swarm init</code> or{' '}
                    <code className="bg-muted rounded px-1">docker swarm join</code> to get started.
                </p>
            </div>
        </div>
    );
}

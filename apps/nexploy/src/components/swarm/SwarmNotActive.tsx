'use client';

import { useState } from 'react';
import { Loader2, Network } from 'lucide-react';
import { InitSwarmDialog } from './InitSwarmDialog';
import { JoinSwarmDialog } from './JoinSwarmDialog';

export function SwarmNotActive() {
    const [isPending, setIsPending] = useState(false);

    const handleSuccess = () => {
        setIsPending(true);
    };

    if (isPending) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center">
                    <div className="bg-primary/10 mx-auto mb-6 flex size-20 items-center justify-center rounded-full">
                        <Loader2 className="text-primary size-10 animate-spin" />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold">Connecting to Swarm...</h2>
                    <p className="text-muted-foreground max-w-md">
                        Please wait while the swarm state is being loaded.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
                <div className="bg-muted/50 mx-auto mb-6 flex size-20 items-center justify-center rounded-full">
                    <Network className="text-muted-foreground size-10" />
                </div>
                <h2 className="mb-2 text-2xl font-semibold">Not in Swarm Mode</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    This Docker host is not part of a swarm cluster. Initialize a new swarm to
                    become the first manager, or join an existing swarm.
                </p>
                <div className="flex justify-center gap-4">
                    <InitSwarmDialog onInitSuccess={handleSuccess} />
                    <JoinSwarmDialog onJoinSuccess={handleSuccess} />
                </div>
            </div>
        </div>
    );
}

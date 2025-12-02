'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function SwarmClusterInfo() {
    const { swarmInfo, isSwarmActive } = useSwarmStore();
    const [showWorkerToken, setShowWorkerToken] = useState(false);
    const [showManagerToken, setShowManagerToken] = useState(false);

    if (!isSwarmActive || !swarmInfo) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const workerJoinCmd = `docker swarm join --token ${swarmInfo.joinTokens.worker} <MANAGER-IP>:2377`;
    const managerJoinCmd = `docker swarm join --token ${swarmInfo.joinTokens.manager} <MANAGER-IP>:2377`;

    return (
        <div className="grid gap-4 px-5 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Worker Join Token</CardTitle>
                    <CardDescription>
                        Use this command to add worker nodes to the swarm
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <code className="bg-muted flex-1 overflow-hidden rounded px-3 py-2 text-xs">
                            {showWorkerToken
                                ? workerJoinCmd
                                : 'docker swarm join --token ••••••••••••••••'}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowWorkerToken(!showWorkerToken)}
                        >
                            {showWorkerToken ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(workerJoinCmd, 'Worker join command')}
                        >
                            <Copy className="size-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Manager Join Token</CardTitle>
                    <CardDescription>
                        Use this command to add manager nodes to the swarm
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <code className="bg-muted flex-1 overflow-hidden rounded px-3 py-2 text-xs">
                            {showManagerToken
                                ? managerJoinCmd
                                : 'docker swarm join --token ••••••••••••••••'}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowManagerToken(!showManagerToken)}
                        >
                            {showManagerToken ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(managerJoinCmd, 'Manager join command')}
                        >
                            <Copy className="size-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

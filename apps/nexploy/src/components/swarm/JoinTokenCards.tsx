'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Copy, Eye, EyeOff, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';

export function JoinTokenCards() {
    const { swarmInfo, isSwarmActive } = useSwarmStore();
    const [showWorkerToken, setShowWorkerToken] = useState(false);
    const [showManagerToken, setShowManagerToken] = useState(false);

    if (!isSwarmActive || !swarmInfo) {
        return null;
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const formatToken = (token: string, show: boolean) => {
        if (show) return token;
        if (!token) return '***';
        return token.slice(0, 15) + '...' + token.slice(-10);
    };

    const getJoinCommand = (token: string, role: string) => {
        const addr = swarmInfo.localNodeId ? `<MANAGER_IP>:2377` : '192.168.x.x:2377';
        return `docker swarm join --token ${token} ${addr}`;
    };

    return (
        <div className="grid gap-4 px-5 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4" />
                        Worker Join Token
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
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
                            className="size-8"
                            onClick={() =>
                                copyToClipboard(
                                    getJoinCommand(swarmInfo.joinTokens.worker, 'worker'),
                                    'Worker join command',
                                )
                            }
                        >
                            <Copy className="size-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <code className="bg-muted block rounded p-2 text-xs break-all">
                        {formatToken(swarmInfo.joinTokens.worker, showWorkerToken)}
                    </code>
                    <p className="text-muted-foreground mt-2 text-xs">
                        Use this token to join new worker nodes to the swarm.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <Crown className="size-4" />
                        Manager Join Token
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
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
                            className="size-8"
                            onClick={() =>
                                copyToClipboard(
                                    getJoinCommand(swarmInfo.joinTokens.manager, 'manager'),
                                    'Manager join command',
                                )
                            }
                        >
                            <Copy className="size-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <code className="bg-muted block rounded p-2 text-xs break-all">
                        {formatToken(swarmInfo.joinTokens.manager, showManagerToken)}
                    </code>
                    <p className="text-muted-foreground mt-2 text-xs">
                        Use this token to join new manager nodes to the swarm.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

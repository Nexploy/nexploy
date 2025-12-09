'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { onSwarmJoinAction } from '@/actions/docker/swarm/join.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';

interface JoinSwarmDialogProps {
    trigger?: React.ReactNode;
    onJoinSuccess?: () => void;
}

export function JoinSwarmDialog({ trigger, onJoinSuccess }: JoinSwarmDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [joinToken, setJoinToken] = useState('');
    const [remoteAddrs, setRemoteAddrs] = useState('');
    const [advertiseAddr, setAdvertiseAddr] = useState('');

    const handleJoin = async () => {
        if (!joinToken) {
            toast.error('Join token is required');
            return;
        }
        if (!remoteAddrs) {
            toast.error('At least one manager address is required');
            return;
        }

        const addrs = remoteAddrs
            .split('\n')
            .map((a) => a.trim())
            .filter((a) => a);

        if (addrs.length === 0) {
            toast.error('At least one manager address is required');
            return;
        }

        setIsLoading(true);
        try {
            await onSwarmJoinAction({
                joinToken,
                remoteAddrs: addrs,
                advertiseAddr: advertiseAddr || undefined,
            });
            toast.success('Joined swarm successfully');
            setOpen(false);
            resetForm();
            // Trigger refresh to update UI immediately
            await onSwarmRefreshAction();
            onJoinSuccess?.();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setJoinToken('');
        setRemoteAddrs('');
        setAdvertiseAddr('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <UserPlus className="mr-2 size-4" />
                        Join Swarm
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Join Docker Swarm</DialogTitle>
                    <DialogDescription>
                        Join an existing swarm cluster as a worker or manager node.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="joinToken">Join Token</Label>
                        <Input
                            id="joinToken"
                            value={joinToken}
                            onChange={(e) => setJoinToken(e.target.value)}
                            placeholder="SWMTKN-1-..."
                            className="font-mono text-sm"
                        />
                        <p className="text-muted-foreground text-xs">
                            The worker or manager token from the swarm you want to join.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="remoteAddrs">Manager Addresses</Label>
                        <Textarea
                            id="remoteAddrs"
                            value={remoteAddrs}
                            onChange={(e) => setRemoteAddrs(e.target.value)}
                            placeholder="192.168.1.100:2377&#10;192.168.1.101:2377"
                            rows={3}
                            className="font-mono text-sm"
                        />
                        <p className="text-muted-foreground text-xs">
                            One or more manager addresses (one per line).
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="advertiseAddr">
                            Advertise Address <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            id="advertiseAddr"
                            value={advertiseAddr}
                            onChange={(e) => setAdvertiseAddr(e.target.value)}
                            placeholder="192.168.1.102:2377"
                        />
                        <p className="text-muted-foreground text-xs">
                            The address this node advertises to other nodes.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleJoin} disabled={isLoading}>
                        {isLoading ? 'Joining...' : 'Join Swarm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

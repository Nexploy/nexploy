'use client';

import { ReactNode, useState } from 'react';
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
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { onInitSwarmAction } from '@/actions/docker/swarm/init.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';

interface InitSwarmDialogProps {
    trigger?: ReactNode;
    onInitSuccess?: () => void;
}

export function InitSwarmDialog({ trigger, onInitSuccess }: InitSwarmDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [advertiseAddr, setAdvertiseAddr] = useState('');
    const [listenAddr, setListenAddr] = useState('0.0.0.0:2377');

    const handleInit = async () => {
        if (!advertiseAddr) {
            toast.error('Advertise address is required');
            return;
        }

        setIsLoading(true);
        try {
            await onInitSwarmAction({
                listenAddr,
                advertiseAddr,
            });

            toast.success('Swarm initialized successfully');
            setOpen(false);
            resetForm();

            await onSwarmRefreshAction();
            onInitSuccess?.();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setAdvertiseAddr('');
        setListenAddr('0.0.0.0:2377');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Play className="mr-2 size-4" />
                        Initialize Swarm
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Initialize Docker Swarm</DialogTitle>
                    <DialogDescription>
                        Create a new swarm cluster with this node as the first manager.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="advertiseAddr">Advertise Address</Label>
                        <Input
                            id="advertiseAddr"
                            value={advertiseAddr}
                            onChange={(e) => setAdvertiseAddr(e.target.value)}
                            placeholder="192.168.1.100:2377"
                        />
                        <p className="text-muted-foreground text-xs">
                            The address other nodes will use to connect to this manager.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="listenAddr">Listen Address</Label>
                        <Input
                            id="listenAddr"
                            value={listenAddr}
                            onChange={(e) => setListenAddr(e.target.value)}
                            placeholder="0.0.0.0:2377"
                        />
                        <p className="text-muted-foreground text-xs">
                            The address this node listens on for swarm traffic.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleInit} disabled={isLoading}>
                        {isLoading ? 'Initializing...' : 'Initialize Swarm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

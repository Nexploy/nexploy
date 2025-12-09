'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Slider } from '@workspace/ui/components/slider';
import { toast } from 'sonner';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';

const DOCKER_API_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://localhost:3300';

interface ScaleServiceDialogProps {
    service: SwarmService;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ScaleServiceDialog({ service, open, onOpenChange }: ScaleServiceDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [replicas, setReplicas] = useState(service.replicas);

    useEffect(() => {
        setReplicas(service.replicas);
    }, [service.replicas]);

    const handleScale = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${DOCKER_API_URL}/api/swarm/services/${service.id}/scale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ replicas }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || error.error || 'Failed to scale service');
            }

            toast.success(`Service ${service.name} scaled to ${replicas} replicas`);
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Scale Service</DialogTitle>
                    <DialogDescription>
                        Adjust the number of replicas for <strong>{service.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between">
                        <Label>
                            Current: {service.runningReplicas}/{service.replicas}
                        </Label>
                        <Label>New: {replicas}</Label>
                    </div>

                    <Slider
                        value={[replicas]}
                        onValueChange={([value]) => setReplicas(value ?? replicas)}
                        min={0}
                        max={20}
                        step={1}
                    />

                    <div className="flex items-center gap-4">
                        <Label htmlFor="replicas-input" className="shrink-0">
                            Replicas
                        </Label>
                        <Input
                            id="replicas-input"
                            type="number"
                            min={0}
                            value={replicas}
                            onChange={(e) => setReplicas(parseInt(e.target.value) || 0)}
                            className="w-24"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReplicas(Math.max(0, replicas - 1))}
                            >
                                -1
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReplicas(replicas + 1)}
                            >
                                +1
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleScale}
                        disabled={isLoading || replicas === service.replicas}
                    >
                        {isLoading ? 'Scaling...' : 'Scale'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

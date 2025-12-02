'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
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
import { SwarmService } from '@workspace/typescript-interface/docker/docker.swarm';
import { MoreHorizontal, Scale, Trash2, RotateCcw, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const DOCKER_API_URL = 'http://localhost:3300';

interface ServiceActionsProps {
    service: SwarmService;
    dockerApiUrl?: string;
}

export function ServiceActions({ service, dockerApiUrl = DOCKER_API_URL }: ServiceActionsProps) {
    const [scaleDialogOpen, setScaleDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [replicas, setReplicas] = useState(service.replicas);
    const [isLoading, setIsLoading] = useState(false);

    const handleScale = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${dockerApiUrl}/api/swarm/services/${service.id}/scale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ replicas }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to scale service');
            }

            toast.success(`Service ${service.name} scaled to ${replicas} replicas`);
            setScaleDialogOpen(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${dockerApiUrl}/api/swarm/services/${service.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete service');
            }

            toast.success(`Service ${service.name} deleted`);
            setDeleteDialogOpen(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRollback = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${dockerApiUrl}/api/swarm/services/${service.id}/rollback`, {
                method: 'POST',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to rollback service');
            }

            toast.success(`Service ${service.name} rolled back`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setScaleDialogOpen(true)}>
                        <Scale className="mr-2 size-4" />
                        Scale
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRollback} disabled={isLoading}>
                        <RotateCcw className="mr-2 size-4" />
                        Rollback
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <FileText className="mr-2 size-4" />
                        View Logs
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={scaleDialogOpen} onOpenChange={setScaleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Scale Service</DialogTitle>
                        <DialogDescription>
                            Adjust the number of replicas for {service.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="replicas" className="text-right">
                                Replicas
                            </Label>
                            <Input
                                id="replicas"
                                type="number"
                                min={0}
                                value={replicas}
                                onChange={(e) => setReplicas(parseInt(e.target.value) || 0)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScaleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleScale} disabled={isLoading}>
                            {isLoading ? 'Scaling...' : 'Scale'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Service</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {service.name}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

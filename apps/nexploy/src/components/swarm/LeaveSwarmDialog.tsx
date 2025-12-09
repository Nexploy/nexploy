'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { onSwarmLeaveAction } from '@/actions/docker/swarm/leave.action';

const DOCKER_API_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://localhost:3300';

interface LeaveSwarmDialogProps {
    trigger?: React.ReactNode;
    isManager?: boolean;
}

export function LeaveSwarmDialog({ trigger, isManager }: LeaveSwarmDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [force, setForce] = useState(false);

    const handleLeave = async () => {
        setIsLoading(true);
        try {
            await onSwarmLeaveAction({ force });
            toast.success('Left swarm successfully');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger || (
                    <Button variant="destructive" size="sm">
                        <LogOut className="mr-2 size-4" />
                        Leave Swarm
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Leave Docker Swarm</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isManager ? (
                            <>
                                This node is a <strong>manager</strong>. Leaving the swarm may affect
                                cluster availability. Make sure there are other managers available
                                before proceeding.
                            </>
                        ) : (
                            <>
                                This will remove this node from the swarm cluster. All tasks running
                                on this node will be stopped.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex items-center space-x-2 py-4">
                    <Checkbox
                        id="force"
                        checked={force}
                        onCheckedChange={(checked) => setForce(checked === true)}
                    />
                    <Label htmlFor="force" className="text-sm">
                        Force leave (even if this is the last manager)
                    </Label>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleLeave}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? 'Leaving...' : 'Leave Swarm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

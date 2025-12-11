'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Loader2, Trash2 } from 'lucide-react';
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
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { useAction } from 'next-safe-action/hooks';
import { deleteRepositoryAction } from '@/actions/repository/settings/deleteRepository.action';
import { toast } from 'sonner';
import { useState } from 'react';
import { Repository } from 'generated/client';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

interface DangerZoneProps {
    repository: Repository;
}
export function DangerZone({ repository }: DangerZoneProps) {
    const [confirmName, setConfirmName] = useState('');

    const deleteRepository = useAction(deleteRepositoryAction, {
        onError: ({ error }) => {
            toast.error(error.serverError || 'Erreur lors de la suppression');
        },
    });

    const handleDelete = () => {
        if (confirmName === repository.name) {
            deleteRepository.execute({ repositoryId: repository.id });
        }
    };

    return (
        <Card className="border-destructive">
            <CardHeaderWithIcon
                isDestructive
                icon={Trash2}
                title={'Zone de danger'}
                description={'Actions irréversibles sur ce repository'}
            />
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Supprimer le repository</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le repository ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Tous les builds, logs et
                                configurations seront supprimés définitivement.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                            <Label htmlFor="confirm-name">
                                Tapez{' '}
                                <span className="font-mono font-semibold">{repository.name}</span>{' '}
                                pour confirmer
                            </Label>
                            <Input
                                id="confirm-name"
                                value={confirmName}
                                onChange={(e) => setConfirmName(e.target.value)}
                                placeholder={repository.name}
                                className="mt-2"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmName('')}>
                                Annuler
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={
                                    confirmName !== repository.name ||
                                    deleteRepository.status === 'executing'
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleteRepository.status === 'executing' ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Trash2 />
                                )}
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

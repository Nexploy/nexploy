'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
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
import { Loader2, Trash2, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import {
    deleteRepositoryAction,
    toggleAutoDeployAction,
} from '@/actions/repository/settings/repositorySettings.action';
import { ChangeBranch } from '@/components/repositories/tabs/settings/ChangeBranch';
import { Repository } from 'generated/client';

interface RepositorySettingsProps {
    repository: Repository;
}

export function RepositorySettings({ repository }: RepositorySettingsProps) {
    const router = useRouter();
    const [autoDeploy, setAutoDeploy] = useState(repository.autoDeploy);
    const [confirmName, setConfirmName] = useState('');

    const toggleAutoDeploy = useAction(toggleAutoDeployAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.autoDeploy ? 'Auto-deploy activé' : 'Auto-deploy désactivé');
            router.refresh();
        },
        onError: () => {
            setAutoDeploy((prevState) => !prevState);
        },
    });

    const deleteRepository = useAction(deleteRepositoryAction, {
        onError: ({ error }) => {
            toast.error(error.serverError || 'Erreur lors de la suppression');
        },
    });

    const handleAutoDeployToggle = (checked: boolean) => {
        setAutoDeploy(checked);
        toggleAutoDeploy.execute({ repositoryId: repository.id, autoDeploy: checked });
    };

    const handleDelete = () => {
        if (confirmName === repository.name) {
            deleteRepository.execute({ repositoryId: repository.id });
        }
    };

    return (
        <div className="mx-5 space-y-6">
            <ChangeBranch repository={repository} />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Webhook className="size-5" />
                        Auto-deploy
                    </CardTitle>
                    <CardDescription>
                        Déclencher automatiquement un build lors d'un push sur la branche
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-deploy">
                                {autoDeploy ? 'Désactiver' : 'Activer'} l'auto-deploy
                            </Label>
                            <p className="text-muted-foreground text-sm">
                                Un webhook sera {autoDeploy ? 'supprimé' : 'configuré'} sur le dépôt
                                Git
                            </p>
                        </div>
                        <Switch
                            id="auto-deploy"
                            checked={autoDeploy}
                            onCheckedChange={handleAutoDeployToggle}
                            disabled={toggleAutoDeploy.status === 'executing'}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="size-5" />
                        Zone de danger
                    </CardTitle>
                    <CardDescription>Actions irréversibles sur ce repository</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 />
                                Supprimer le repository
                            </Button>
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
                                    <span className="font-mono font-semibold">
                                        {repository.name}
                                    </span>{' '}
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
        </div>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Network, Pencil, Plus, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { PortForm } from '@/components/docker/container/forms/PortForm';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { PortFormProps } from '@workspace/typescript-interface/docker/docker.port';
import { NonUndefined } from 'react-hook-form';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { onContainerDeletePortAction } from '@/actions/docker/container/port/containerDeletePort.action';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CardExposedPorts() {
    const container = useContainerStore((state) => state.container);
    const { openDialog } = useConfirmationDialogStore();
    const { openAlertDialog, closeAlertDialog } = useAlertConfirmationDialogStore();
    const router = useRouter();

    const handleAddPort = () =>
        openDialog({
            closeOnBackground: true,
            title: 'Ajouter un port',
            description:
                'Le conteneur doit être arrêté pour ajouter un port. Il sera recréé avec la nouvelle configuration.',
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <PortForm mode="add" />,
        });

    const handleEditPort = (port: PortFormProps['defaultPort']) =>
        openDialog({
            closeOnBackground: true,
            title: 'Modifier un port',
            description:
                'Le conteneur doit être arrêté pour modifier un port. Il sera recréé avec la nouvelle configuration.',
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <PortForm mode="edit" defaultPort={port} />,
        });

    const handleDeletePort = (port: NonUndefined<PortFormProps['defaultPort']>) =>
        openAlertDialog({
            title: 'Supprimer un port',
            description: `Êtes-vous sûr de vouloir supprimer le port ${port.publicPort ?? '—'} → ${port.privatePort} (${port.type}) ?`,
            props: {
                className: 'sm:max-w-[425px]',
            },
            cancelLabel: 'Annuler',
            actionLabel: 'Supprimer',
            onAction: async () => {
                const { data } = await onContainerDeletePortAction({
                    containerId: container!.id,
                    containerPort: port.privatePort,
                    hostPort: port.publicPort,
                });

                if (!data) return;
                router.replace(`/docker/containers/${data.id}`);
                toast.dismiss();
                toast.success(
                    `Le port (${port.publicPort} → ${port.privatePort}) a bien été ajouté`,
                );
                closeAlertDialog();
            },
        });

    if (!container) {
        return <Skeleton className={'h-90 flex-1'} />;
    }

    return (
        <Card className={'flex flex-1 flex-col'}>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div className={'flex items-center gap-3'}>
                        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <Network className="text-primary size-4" />
                        </div>
                        <CardTitle>Ports exposés</CardTitle>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className={'size-9 xl:size-fit'}
                                icon={Plus}
                                onClick={handleAddPort}
                            >
                                <span className={'hidden xl:flex'}>Add port</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={'flex xl:hidden'}>
                            <span>Add port</span>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </CardHeader>
            <CardContent className={'flex flex-col overflow-hidden px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-60 overflow-hidden px-6"
                >
                    {container.network.ports.length ? (
                        <div className="grid grid-rows-1 gap-2 md:grid-rows-2 lg:grid-rows-3">
                            {container.network.ports.map((port, idx) => (
                                <div
                                    key={idx}
                                    className="bg-muted/50 group flex items-center justify-between gap-2 rounded-md px-3 py-2"
                                >
                                    <code className="flex gap-2 text-sm leading-none">
                                        <span className="font-semibold">
                                            {port.publicPort ?? '—'}
                                        </span>
                                        <span className="text-muted-foreground">→</span>
                                        <span>{port.privatePort}</span>
                                        <span className="text-muted-foreground">({port.type})</span>
                                    </code>
                                    <div className="flex gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleEditPort(port)}
                                                >
                                                    <Pencil />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Modifier</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDeletePort(port)}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Supprimer</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mb-16 flex flex-1 items-center justify-center">
                            <p className="text-muted-foreground text-center">Aucun port exposé</p>
                        </div>
                    )}
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}

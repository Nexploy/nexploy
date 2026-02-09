'use client';

import {
    initializeEnvironmentStore,
    useEnvironmentStore,
} from '@/stores/environment/useEnvironmentStore';
import { useMemo } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { Check, ChevronsUpDown, MoreHorizontal, Pencil, Plus, Trash } from 'lucide-react';
import { CreateEnvironmentForm } from '@/components/sidebar/environment/CreateEnvironmentForm';
import { EditEnvironmentForm } from '@/components/sidebar/environment/EditEnvironmentForm';
import { Environment } from 'generated/client';
import { deleteEnvironmentAction } from '@/actions/environment/deleteEnvironment.action';
import { setDefaultEnvironmentAction } from '@/actions/environment/setDefaultEnvironment.action';
import { useRouter } from 'next/navigation';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface DropdownEnvironment {
    environments: Environment[];
}

export function DropdownEnvironment({ environments }: DropdownEnvironment) {
    const router = useRouter();

    useMemo(() => initializeEnvironmentStore(environments), []);

    const {
        environments: storeEnvironments,
        selectedEnvironmentId,
        selectEnvironment,
        addEnvironment,
        removeEnvironment,
        getSelectedEnvironment,
    } = useEnvironmentStore();

    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const { openAlertDialog } = useAlertConfirmationDialogStore();
    const t = useTranslations('navigation');
    const tCommon = useTranslations('common');

    const currentEnvironment = getSelectedEnvironment();

    const handleEnvironmentAdd = () => {
        openDialog({
            title: t('addDockerEnvironment'),
            description: t('addDockerEnvironmentDescription'),
            content: <CreateEnvironmentForm />,
            onSuccess: async (environment) => {
                addEnvironment(environment);
                await setDefaultEnvironmentAction({ environmentId: environment.id });
                router.refresh();
                closeDialog();
            },
        });
    };

    const handleEnvironmentsChange = async (environmentId: string) => {
        if (environmentId === selectedEnvironmentId) return;

        selectEnvironment(environmentId);
        await setDefaultEnvironmentAction({ environmentId });
        router.refresh();
    };

    const handleEnvironmentEdit = (environment: Environment) => {
        openDialog({
            title: t('editDockerEnvironment'),
            description: t('editDockerEnvironmentDescription', { name: environment.name }),
            content: <EditEnvironmentForm environment={environment} />,
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    const handleEnvironmentDelete = async (environment: Environment) => {
        openAlertDialog({
            title: t('deleteEnvironment'),
            description: t('deleteEnvironmentConfirm', { name: environment.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('delete'),
            onAction: async () => {
                await deleteEnvironmentAction({ environmentId: environment.id });
                removeEnvironment(environment.id);

                if (selectedEnvironmentId === environment.id) {
                    const remainingEnvironments = storeEnvironments.filter(
                        (env) => env.id !== environment.id,
                    );
                    if (remainingEnvironments.length) {
                        const firstEnv = remainingEnvironments[0];
                        selectEnvironment(firstEnv!.id);
                        await setDefaultEnvironmentAction({ environmentId: firstEnv!.id });
                    }
                }

                router.refresh();
            },
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="aspect-square w-16 !p-0 group-data-[state=collapsed]:justify-start group-data-[state=collapsed]:!bg-transparent"
                        title={currentEnvironment?.name || t('noEnvironment')}
                    >
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded font-semibold">
                            {currentEnvironment?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <ChevronsUpDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                >
                    <DropdownMenuLabel className="text-muted-foreground text-xs">
                        {t('environments')}
                    </DropdownMenuLabel>
                    {storeEnvironments.map((environment) => (
                        <div key={environment.id} className="flex items-center">
                            <DropdownMenuItem
                                onClick={() => handleEnvironmentsChange(environment.id)}
                                className="flex-1 gap-2"
                            >
                                <div className="bg-background flex size-6 items-center justify-center rounded-sm border">
                                    <span className="text-xs font-medium">
                                        {environment.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="flex-1">{environment.name}</span>
                                {selectedEnvironmentId === environment.id && (
                                    <Check className="ml-auto" size={16} />
                                )}
                            </DropdownMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={(e) => handleEnvironmentEdit(environment)}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {t('edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={(e) => handleEnvironmentDelete(environment)}
                                    >
                                        <Trash className="mr-2 h-4 w-4" />
                                        {t('delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-2" onClick={handleEnvironmentAdd}>
                        <div className="bg-background flex size-6 items-center justify-center rounded-md border border-dashed">
                            <Plus size={14} />
                        </div>
                        <span>{t('addEnvironment')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

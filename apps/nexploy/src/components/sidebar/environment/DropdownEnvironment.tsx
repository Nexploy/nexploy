'use client';

import {
    initializeEnvironmentStore,
    useEnvironmentStore,
} from '@/stores/environment/useEnvironmentStore';
import { useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@workspace/ui/components/sidebar';
import { Check, ChevronsUpDown, MoreHorizontal, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { CreateEnvironmentForm } from '@/components/sidebar/environment/CreateEnvironmentForm';
import { EditEnvironmentForm } from '@/components/sidebar/environment/EditEnvironmentForm';
import { Environment } from 'generated/client';
import { deleteEnvironmentAction } from '@/actions/environment/deleteEnvironment.action';
import { setDefaultEnvironmentAction } from '@/actions/environment/setDefaultEnvironment.action';
import { useRouter } from 'next/navigation';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { usePermissions } from '@/contexts/PermissionContext';

interface DropdownEnvironmentProps {
    environments: Environment[];
}

export function DropdownEnvironment({ environments }: DropdownEnvironmentProps) {
    const router = useRouter();
    const { isMobile, state } = useSidebar();

    useEffect(() => initializeEnvironmentStore(environments), []);

    const {
        environments: storeEnvironments,
        selectedEnvironmentId,
        selectEnvironment,
        addEnvironment,
        removeEnvironment,
        updateEnvironment,
        getSelectedEnvironment,
    } = useEnvironmentStore();

    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const { openAlertDialog } = useAlertConfirmationDialogStore();
    const t = useTranslations('navigation');
    const tCommon = useTranslations('common');

    const { can } = usePermissions();

    const { execute } = useAction(setDefaultEnvironmentAction, {
        onSuccess: ({ input }) => {
            storeEnvironments.forEach((env) => {
                updateEnvironment(env.id, { isDefault: env.id === input.environmentId });
            });
            router.refresh();
        },
    });

    const currentEnvironment = getSelectedEnvironment();
    const isSidebarExpanded = state === 'expanded' || isMobile;

    const handleEnvironmentAdd = () => {
        openDialog({
            title: t('addDockerEnvironment'),
            description: t('addDockerEnvironmentDescription'),
            content: <CreateEnvironmentForm />,
            onSuccess: async (environment) => {
                addEnvironment(environment);
                router.refresh();
                closeDialog();
            },
        });
    };

    const handleEnvironmentsChange = async (environmentId: string) => {
        if (environmentId === selectedEnvironmentId) return;
        selectEnvironment(environmentId);
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

    const handleSetAsDefault = (environment: Environment) => {
        openDialog({
            title: t('setAsDefault'),
            description: t('setAsDefaultConfirm', { name: environment.name }),
            content: (
                <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        onClick={() => {
                            execute({ environmentId: environment.id });
                            closeDialog();
                        }}
                    >
                        {t('setAsDefault')}
                    </Button>
                </DialogFooter>
            ),
        });
    };

    const handleEnvironmentDelete = async (environment: Environment) => {
        openAlertDialog({
            title: t('deleteEnvironment'),
            description: t('deleteEnvironmentConfirm', { name: environment.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('delete'),
            onAction: async () => {
                const result = await deleteEnvironmentAction({ environmentId: environment.id });
                if (!result?.serverError) {
                    removeEnvironment(environment.id);

                    if (selectedEnvironmentId === environment.id) {
                        const remaining = storeEnvironments.filter(
                            (env) => env.id !== environment.id,
                        );
                        if (remaining.length) selectEnvironment(remaining[0]!.id);
                    }

                    router.refresh();
                }
            },
        });
    };

    return (
        <SidebarMenu className="w-fit">
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="flex h-10 w-18 cursor-pointer justify-between gap-1 group-data-[state=collapsed]:justify-start group-data-[state=collapsed]:!bg-transparent group-data-[state=collapsed]:p-0!">
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-semibold">
                                {currentEnvironment?.name?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <ChevronsUpDown className="group-data-[state=collapsed]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isSidebarExpanded ? 'bottom' : 'right'}
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
                                    <div className={'flex flex-1 items-center gap-2'}>
                                        {environment.name}
                                        {environment.isDefault && (
                                            <Star className="text-muted-foreground size-3 fill-current" />
                                        )}
                                    </div>
                                    {selectedEnvironmentId === environment.id && (
                                        <Check className="size-4" />
                                    )}
                                </DropdownMenuItem>
                                {can('environment', 'update') && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="size-7 shrink-0 p-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side={'right'} align="start">
                                            <DropdownMenuItem
                                                onClick={() => handleEnvironmentEdit(environment)}
                                            >
                                                <Pencil />
                                                {t('edit')}
                                            </DropdownMenuItem>
                                            {!environment.isDefault && (
                                                <DropdownMenuItem
                                                    onClick={() => handleSetAsDefault(environment)}
                                                >
                                                    <Star className={'fill-current'} />
                                                    {t('setAsDefault')}
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => handleEnvironmentDelete(environment)}
                                            >
                                                <Trash2 />
                                                {t('delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))}
                        {can('environment', 'create') && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="gap-2 p-2"
                                    onClick={handleEnvironmentAdd}
                                >
                                    <div className="bg-background flex size-6 items-center justify-center rounded-md border border-dashed">
                                        <Plus size={14} />
                                    </div>
                                    <span>{t('addEnvironment')}</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

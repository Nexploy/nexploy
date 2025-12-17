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
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { CreateEnvironmentForm } from '@/components/sidebar/environment/CreateEnvironmentForm';
import { Environment } from 'generated/client';
import { setDefaultEnvironmentAction } from '@/actions/environment/environment.action';
import { useRouter } from 'next/navigation';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

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
        getSelectedEnvironment,
    } = useEnvironmentStore();

    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const currentEnvironment = getSelectedEnvironment();

    const handleEnvironmentCreate = (environment: any) => {
        openDialog({
            title: 'Create Docker environment',
            description:
                'Add a new Docker environment to manage containers across different hosts.',
            content: <CreateEnvironmentForm />,
            onSuccess: () => {
                addEnvironment(environment);
                selectEnvironment(environment.id);
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

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="aspect-square w-16 !p-0 group-data-[state=collapsed]:justify-start"
                        title={currentEnvironment?.name || 'No environment'}
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
                        Environments
                    </DropdownMenuLabel>
                    {storeEnvironments.map((environment) => (
                        <DropdownMenuItem
                            key={environment.id}
                            onClick={() => handleEnvironmentsChange(environment.id)}
                            className="gap-2"
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
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-2" onClick={handleEnvironmentCreate}>
                        <div className="bg-background flex size-6 items-center justify-center rounded-md border border-dashed">
                            <Plus size={14} />
                        </div>
                        <span>Create environment</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

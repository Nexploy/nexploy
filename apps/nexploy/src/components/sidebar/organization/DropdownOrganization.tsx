'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useTransition } from 'react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@workspace/ui/components/sidebar';
import {
    Check,
    ChevronsUpDown,
    LogOut,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { UserOrganization } from '@workspace/typescript-interface/organization/organization';
import { setActiveOrganizationAction } from '@/actions/organization/setActiveOrganization.action';
import { deleteOrganizationAction } from '@/actions/organization/deleteOrganization.action';
import { leaveOrganizationAction } from '@/actions/organization/leaveOrganization.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import {
    initializeOrganizationStore,
    useOrganizationStore,
} from '@/stores/organization/useOrganizationStore';
import { CreateOrganizationForm } from '@/components/organization/CreateOrganizationForm';
import { RenameOrganizationForm } from '@/components/organization/RenameOrganizationForm';
import { DicebearAvatar } from '@/components/shared/DicebearAvatar.tsx';

interface DropdownOrganizationProps {
    organizations: UserOrganization[];
    activeOrganizationId: string | null;
}

export function DropdownOrganization({
    organizations,
    activeOrganizationId,
}: DropdownOrganizationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isMobile, state } = useSidebar();
    const t = useTranslations('organization');
    const tCommon = useTranslations('common');
    const [isPending, startTransition] = useTransition();
    const { openDialog } = useConfirmationDialogStore();
    const { openAlertDialog } = useAlertConfirmationDialogStore();

    useLayoutEffect(() => initializeOrganizationStore(organizations, activeOrganizationId), []);

    const storeOrganizations = useOrganizationStore((s) => s.organizations);
    const storeActiveId = useOrganizationStore((s) => s.activeOrganizationId);
    const selectOrganization = useOrganizationStore((s) => s.selectOrganization);
    const removeOrganization = useOrganizationStore((s) => s.removeOrganization);

    const isStoreReady = storeOrganizations.length > 0;
    const visibleOrganizations = isStoreReady ? storeOrganizations : organizations;
    const activeId = isStoreReady ? storeActiveId : activeOrganizationId;

    const current = visibleOrganizations.find((o) => o.id === activeId) ?? visibleOrganizations[0];
    const isSidebarExpanded = state === 'expanded' || isMobile;

    const handleSelect = (organizationId: string) => {
        if (organizationId === activeId) return;

        const previousId = activeId;
        selectOrganization(organizationId);

        startTransition(async () => {
            const result = await setActiveOrganizationAction({ organizationId });
            if (result?.serverError) {
                toast.error(result.serverError);
                if (previousId) selectOrganization(previousId);
                return;
            }
            router.refresh();
        });
    };

    const handleOrganizationRemoved = (organizationId: string) => {
        removeOrganization(organizationId);

        if (pathname.includes(`/organizations/${organizationId}`)) {
            router.back();
            return;
        }
        router.refresh();
    };

    const handleCreate = () => {
        openDialog({
            title: t('createOrganization'),
            description: t('createOrganizationDescription'),
            content: <CreateOrganizationForm />,
        });
    };

    const handleRename = (organization: UserOrganization) => {
        openDialog({
            title: t('settings.rename'),
            description: t('settings.renameDescription', { name: organization.name }),
            content: (
                <RenameOrganizationForm organizationId={organization.id} name={organization.name} />
            ),
        });
    };

    const handleLeave = (organization: UserOrganization) => {
        openAlertDialog({
            title: t('settings.leaveOrganization'),
            description: t('settings.confirmLeave', { name: organization.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('settings.leaveOrganization'),
            onAction: async () => {
                const result = await leaveOrganizationAction({ organizationId: organization.id });
                if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                }
                handleOrganizationRemoved(organization.id);
            },
        });
    };

    const handleDelete = (organization: UserOrganization) => {
        openAlertDialog({
            title: t('settings.deleteOrganization'),
            description: t('settings.confirmDelete', { name: organization.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('settings.deleteOrganization'),
            onAction: async () => {
                const result = await deleteOrganizationAction({ organizationId: organization.id });
                if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                }
                handleOrganizationRemoved(organization.id);
            },
        });
    };

    if (visibleOrganizations.length === 0) return null;

    return (
        <SidebarMenu className="px-4 pb-2">
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            disabled={isPending}
                            className="border-sidebar-border bg-sidebar-accent/40 h-9 cursor-pointer gap-2 rounded-md border text-sm font-medium"
                        >
                            <DicebearAvatar
                                seed={current?.name}
                                size={24}
                                style={'glass'}
                                alt="Organization Icon"
                            />
                            <span className="flex-1 truncate">{current?.name}</span>
                            <ChevronsUpDown className="text-muted-foreground size-3.5" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        side={isSidebarExpanded ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            {t('title')}
                        </DropdownMenuLabel>
                        {visibleOrganizations.map((organization) => {
                            const canViewMembers = !organization.isPersonal;
                            const canRename =
                                !organization.isPersonal &&
                                (organization.role === 'owner' || organization.role === 'admin');
                            const canDelete =
                                organization.role === 'owner' && !organization.isPersonal;
                            const hasMenuActions =
                                canViewMembers || canRename || canDelete || organization.canLeave;

                            return (
                                <div key={organization.id} className="flex items-center">
                                    <DropdownMenuItem
                                        onClick={() => handleSelect(organization.id)}
                                        className="flex-1 gap-2"
                                    >
                                        <DicebearAvatar
                                            seed={organization.name}
                                            size={24}
                                            style={'glass'}
                                            alt="Organization Icon"
                                        />
                                        <span className="flex-1">{organization.name}</span>
                                        {current?.id === organization.id && (
                                            <Check className="size-4" />
                                        )}
                                    </DropdownMenuItem>
                                    {hasMenuActions && (
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
                                                {canViewMembers && (
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/organizations/${organization.id}/members`}
                                                        >
                                                            <Users />
                                                            {t('members.title')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                {canRename && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleRename(organization)}
                                                    >
                                                        <Pencil />
                                                        {t('settings.rename')}
                                                    </DropdownMenuItem>
                                                )}
                                                {(canViewMembers || canRename) &&
                                                    (organization.canLeave || canDelete) && (
                                                        <DropdownMenuSeparator />
                                                    )}
                                                {organization.canLeave && (
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleLeave(organization)}
                                                    >
                                                        <LogOut />
                                                        {t('settings.leaveOrganization')}
                                                    </DropdownMenuItem>
                                                )}
                                                {canDelete && (
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleDelete(organization)}
                                                    >
                                                        <Trash2 />
                                                        {tCommon('delete')}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            );
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={handleCreate}>
                            <div className="bg-background flex size-6 items-center justify-center rounded-md border border-dashed">
                                <Plus size={14} />
                            </div>
                            <span>{t('createOrganization')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

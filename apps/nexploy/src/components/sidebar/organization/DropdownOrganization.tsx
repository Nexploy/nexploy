'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
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
    Building2,
    Check,
    ChevronsUpDown,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { setActiveOrganizationAction } from '@/actions/organization/setActiveOrganization.action';
import { deleteOrganizationAction } from '@/actions/organization/deleteOrganization.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { CreateOrganizationForm } from '@/components/organization/CreateOrganizationForm';
import { RenameOrganizationForm } from '@/components/organization/RenameOrganizationForm';

interface OrganizationWithRole {
    id: string;
    name: string;
    slug: string;
    role: string;
}

interface DropdownOrganizationProps {
    organizations: OrganizationWithRole[];
    activeOrganizationId: string | null;
}

export function DropdownOrganization({
    organizations,
    activeOrganizationId,
}: DropdownOrganizationProps) {
    const router = useRouter();
    const { isMobile, state } = useSidebar();
    const t = useTranslations('organization');
    const tCommon = useTranslations('common');
    const [isPending, startTransition] = useTransition();
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const { openAlertDialog } = useAlertConfirmationDialogStore();

    const current = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0];
    const isSidebarExpanded = state === 'expanded' || isMobile;

    const handleSelect = (organizationId: string) => {
        if (organizationId === current?.id) return;
        startTransition(async () => {
            await setActiveOrganizationAction({ organizationId });
            router.refresh();
        });
    };

    const handleCreate = () => {
        openDialog({
            title: t('createOrganization'),
            description: t('createOrganizationDescription'),
            content: <CreateOrganizationForm />,
        });
    };

    const handleRename = (organization: OrganizationWithRole) => {
        openDialog({
            title: t('settings.rename'),
            description: t('settings.renameDescription', { name: organization.name }),
            content: (
                <RenameOrganizationForm organizationId={organization.id} name={organization.name} />
            ),
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    const handleDelete = (organization: OrganizationWithRole) => {
        openAlertDialog({
            title: t('settings.deleteOrganization'),
            description: t('settings.confirmDelete', { name: organization.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('settings.deleteOrganization'),
            onAction: async () => {
                const result = await deleteOrganizationAction({
                    organizationId: organization.id,
                });
                if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                }
                router.refresh();
            },
        });
    };

    if (organizations.length === 0) return null;

    return (
        <SidebarMenu className="px-4">
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            disabled={isPending}
                            className="border-sidebar-border bg-sidebar-accent/40 h-9 cursor-pointer gap-2 rounded-md border text-sm font-medium"
                        >
                            <Building2 className="text-muted-foreground size-4 shrink-0" />
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
                        {organizations.map((organization) => (
                            <div key={organization.id} className="flex items-center">
                                <DropdownMenuItem
                                    onClick={() => handleSelect(organization.id)}
                                    className="flex-1 gap-2"
                                >
                                    <Building2 className="text-muted-foreground size-4 shrink-0" />
                                    <span className="flex-1">{organization.name}</span>
                                    {current?.id === organization.id && (
                                        <Check className="size-4" />
                                    )}
                                </DropdownMenuItem>
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
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={`/organizations/${organization.id}/members`}
                                            >
                                                <Users />
                                                {t('members.title')}
                                            </Link>
                                        </DropdownMenuItem>
                                        {(organization.role === 'owner' ||
                                            organization.role === 'admin') && (
                                            <DropdownMenuItem
                                                onClick={() => handleRename(organization)}
                                            >
                                                <Pencil />
                                                {t('settings.rename')}
                                            </DropdownMenuItem>
                                        )}
                                        {organization.role === 'owner' && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => handleDelete(organization)}
                                                >
                                                    <Trash2 />
                                                    {tCommon('delete')}
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={handleCreate}>
                            <Plus className="text-muted-foreground size-4 shrink-0" />
                            <span>{t('createOrganization')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

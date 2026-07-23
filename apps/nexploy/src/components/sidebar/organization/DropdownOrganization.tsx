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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@workspace/ui/components/sidebar';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { setActiveOrganizationAction } from '@/actions/organization/setActiveOrganization.action';

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
    const [isPending, startTransition] = useTransition();

    const current = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0];
    const isSidebarExpanded = state === 'expanded' || isMobile;

    const handleSelect = (organizationId: string) => {
        if (organizationId === current?.id) return;
        startTransition(async () => {
            await setActiveOrganizationAction({ organizationId });
            router.refresh();
        });
    };

    if (organizations.length === 0) return null;

    return (
        <SidebarMenu className="w-fit">
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            disabled={isPending}
                            className="flex h-10 w-18 cursor-pointer justify-between gap-1 group-data-[state=collapsed]:justify-start group-data-[state=collapsed]:bg-transparent! group-data-[state=collapsed]:p-0!"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-semibold">
                                {current?.name?.charAt(0).toUpperCase() ?? '?'}
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
                            {t('title')}
                        </DropdownMenuLabel>
                        {organizations.map((organization) => (
                            <DropdownMenuItem
                                key={organization.id}
                                onClick={() => handleSelect(organization.id)}
                                className="gap-2"
                            >
                                <div className="bg-background flex size-6 items-center justify-center rounded-sm border">
                                    <span className="text-xs font-medium">
                                        {organization.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="flex-1">{organization.name}</span>
                                {current?.id === organization.id && <Check className="size-4" />}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="gap-2 p-2">
                            <Link href="/organizations">
                                <div className="bg-background flex size-6 items-center justify-center rounded-md border border-dashed">
                                    <Plus size={14} />
                                </div>
                                <span>{t('manage')}</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

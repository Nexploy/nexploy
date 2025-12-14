'use client';

import { createAvatar } from '@dicebear/core';
import { glass } from '@dicebear/collection';
import { ComponentProps } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import { SidebarMenuButton, useSidebar } from '@workspace/ui/components/sidebar';
import { Session } from '@/lib/auth/auth';

interface AvatarProps {
    session: Session | null;
}

export function AvatarDisplay({
    session,
    className,
    ...props
}: AvatarProps & ComponentProps<'button'>) {
    const avatar = createAvatar(glass, {
        seed: session?.user.name,
        size: 12,
    }).toDataUri();

    const { state, isMobile } = useSidebar();

    const isSidebarExpanded = state === 'expanded' || isMobile;

    return (
        <SidebarMenuButton
            {...props}
            size={isSidebarExpanded ? 'default' : 'lg'}
            className={'cursor-pointer py-5'}
        >
            <Image
                className={cn(
                    'size-full rounded-md select-none',
                    isSidebarExpanded && 'size-7',
                    className,
                )}
                src={avatar}
                width={28}
                height={28}
                alt="Account Image"
            />
            <span className={'truncate'}>{session?.user.name}</span>
            <ChevronUp className="ml-auto" />
        </SidebarMenuButton>
    );
}

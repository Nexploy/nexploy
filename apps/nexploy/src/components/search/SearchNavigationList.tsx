'use client';

import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import {
    Activity,
    Bug,
    Container,
    EthernetPort,
    FolderGit2,
    HardDrive,
    LayoutList,
    Network,
    Send,
    User,
    Warehouse,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ComponentType } from 'react';
import { useSearchStore } from './useSearchStore';

interface NavItem {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
}

export function SearchNavigationList() {
    const router = useRouter();
    const t = useTranslations('ai.command');
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);

    const homeItems: NavItem[] = [
        {
            href: '/repositories',
            icon: FolderGit2,
            label: tNav('repositories'),
        },
        { href: '/monitoring', icon: Activity, label: tNav('monitoring') },
        { href: '/requests', icon: Send, label: tNav('requests') },
        { href: '/swarm', icon: Network, label: tNav('swarm') },
        {
            href: '/admin/registry',
            icon: Warehouse,
            label: tNav('registry'),
        },
    ];

    const dockerItems: NavItem[] = [
        {
            href: '/docker/containers',
            icon: Container,
            label: tNav('containers'),
        },
        { href: '/docker/images', icon: LayoutList, label: tNav('images') },
        { href: '/docker/volumes', icon: HardDrive, label: tNav('volumes') },
        {
            href: '/docker/networks',
            icon: EthernetPort,
            label: tNav('networks'),
        },
        { href: '/docker/events', icon: Bug, label: tNav('events') },
    ];

    const renderItem = ({ href, icon: Icon, label }: NavItem, index: number) => (
        <CommandItem
            key={index}
            value={label}
            onSelect={() => runCommand(() => router.push(href))}
            className={'rounded'}
        >
            <Icon className="text-muted-foreground ml-1 shrink-0" />
            <span className="text-sm font-medium">{label}</span>
        </CommandItem>
    );

    return (
        <>
            <CommandGroup heading={tNav('home')}>{homeItems.map(renderItem)}</CommandGroup>
            <CommandGroup heading={tNav('docker')}>{dockerItems.map(renderItem)}</CommandGroup>
            <CommandGroup heading={t('system')}>
                <CommandItem
                    value={t('account')}
                    onSelect={() => runCommand(() => router.push('/account'))}
                >
                    <User className="text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">{t('account')}</span>
                </CommandItem>
            </CommandGroup>
        </>
    );
}

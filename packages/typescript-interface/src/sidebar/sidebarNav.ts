import { ElementType } from 'react';

export interface SidebarNavTranslations {
    home: string;
    repositories: string;
    monitoring: string;
    docker: string;
    containers: string;
    images: string;
    volumes: string;
    networks: string;
    events: string;
    swarm: string;
    requests: string;
    admin: string;
    users: string;
    backups: string;
    ai: string;
    tools: string;
    integrations: string;
}

export interface SidebarNavGroup {
    titleKey: keyof SidebarNavTranslations;
    children: SidebarItem[];
}

export interface SidebarItem {
    titleKey: keyof SidebarNavTranslations;
    icon: ElementType;
    href: string;
    className?: string;
    hasActionIcon?: boolean;
    enableCollapsible?: boolean;
    children?: SidebarItem[];
}

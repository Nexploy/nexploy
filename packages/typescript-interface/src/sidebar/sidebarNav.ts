import { ElementType } from 'react';

export interface SidebarNavGroup {
    titleKey: string;
    children: SidebarItem[];
}

export interface SidebarItem {
    titleKey: string;
    icon: ElementType;
    href: string;
    className?: string;
    hasActionIcon?: boolean;
    enableCollapsible?: boolean;
    children?: SidebarItem[];
}

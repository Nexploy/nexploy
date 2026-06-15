import { ElementType, JSX } from 'react';

export interface SidebarNavGroup {
    titleKey: string;
    children: SidebarItem[];
}

export interface SidebarItem {
    titleKey: string;
    icon: ElementType;
    href: string;
    className?: string;
    actionIcon?: JSX.Element;
    enableCollapsible?: boolean;
    defaultCollapsibleOpen?: boolean;
    children?: SidebarItem[];
}

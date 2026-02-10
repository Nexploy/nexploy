'use client';

import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { addSpaceBeforeUppercase, capitalizeWords } from '@/utils/capitalize';
import { useContainerStore } from '@/stores/docker/useContainerStore';

const ITEMS_TO_DISPLAY = 2;
const MAX_ITEMS_BEFORE_COLLAPSE = 3;

export function BreadcrumbPath() {
    const pathname = usePathname();
    const container = useContainerStore((state) => state.container);

    const segments = pathname.split('/').filter(Boolean);

    const paths = segments.map((segment, index) => {
        let displayName = capitalizeWords(addSpaceBeforeUppercase(segment));
        let isLoading = false;

        const isContainerId = segments[index - 1] === 'containers' && segment.length > 20;

        if (isContainerId) {
            if (container?.name) {
                displayName = container.name;
            } else {
                isLoading = true;
            }
        }

        return {
            name: displayName,
            href: '/' + segments.slice(0, index + 1).join('/'),
            isLast: index === segments.length - 1,
            isLoading,
        };
    });

    const SkeletonStyled = () => <Skeleton className="h-4 w-24 rounded-sm" />;

    if (paths.length === 0) return null;

    if (paths.length <= MAX_ITEMS_BEFORE_COLLAPSE) {
        return (
            <Breadcrumb className="hidden pl-1 md:flex">
                <BreadcrumbList className="flex-nowrap">
                    {paths.map(({ name, href, isLast, isLoading }) => (
                        <Fragment key={href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="line-clamp-1 break-all">
                                        {isLoading ? <SkeletonStyled /> : name}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>
                                            {isLoading ? <SkeletonStyled /> : name}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    const firstItems = paths.slice(0, ITEMS_TO_DISPLAY);
    const lastItem = paths[paths.length - 1]!;
    const middleItems = paths.slice(ITEMS_TO_DISPLAY, -1);

    return (
        <Breadcrumb className="hidden min-w-0 flex-1 cursor-pointer overflow-hidden pl-1 md:flex">
            <BreadcrumbList className="flex-nowrap">
                {firstItems.map(({ name, href, isLoading }) => (
                    <Fragment key={href}>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={href}>{isLoading ? <SkeletonStyled /> : name}</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </Fragment>
                ))}
                <BreadcrumbItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1">
                            <BreadcrumbEllipsis className="size-4" />
                            <span className="sr-only">Toggle menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {middleItems.map(({ name, href, isLoading }) => (
                                <DropdownMenuItem key={href} asChild>
                                    <Link href={href}>{isLoading ? <SkeletonStyled /> : name}</Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1 break-all">
                        {lastItem.isLoading ? <SkeletonStyled /> : lastItem.name}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}

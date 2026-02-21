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
import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';
import { useParams, usePathname } from 'next/navigation';
import { addSpaceBeforeUppercase, capitalizeWords } from '@/utils/capitalize';
import { useBreadcrumbStore } from '@/stores/useBreadcrumbStore';

const ITEMS_TO_DISPLAY = 2;
const MAX_ITEMS_BEFORE_COLLAPSE = 3;

export function BreadcrumbPath() {
    const pathname = usePathname();
    const params = useParams();
    const overrides = useBreadcrumbStore((state) => state.overrides);

    const segmentToParamName = Object.fromEntries(
        Object.entries(params).flatMap(([paramName, value]) =>
            Array.isArray(value) ? value.map((v) => [v, paramName]) : [[value, paramName]],
        ),
    );

    const segments = pathname.split('/').filter(Boolean);

    const paths = segments.map((segment, index) => {
        const paramName = segmentToParamName[segment];
        const override = paramName ? overrides[paramName] : undefined;

        return {
            name: override ?? capitalizeWords(addSpaceBeforeUppercase(segment)),
            href: '/' + segments.slice(0, index + 1).join('/'),
            isLast: index === segments.length - 1,
        };
    });

    if (paths.length === 0) return null;

    if (paths.length <= MAX_ITEMS_BEFORE_COLLAPSE) {
        return (
            <Breadcrumb className="hidden pl-1 md:flex">
                <BreadcrumbList className="flex-nowrap">
                    {paths.map(({ name, href, isLast }) => (
                        <Fragment key={href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="line-clamp-1 break-all">
                                        {name}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>{name}</Link>
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
                {firstItems.map(({ name, href }) => (
                    <Fragment key={href}>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={href}>{name}</Link>
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
                            {middleItems.map(({ name, href }) => (
                                <DropdownMenuItem key={href} asChild>
                                    <Link href={href}>{name}</Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1 break-all">
                        {lastItem.name}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}

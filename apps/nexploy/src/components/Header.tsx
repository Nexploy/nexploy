'use client';

import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { ToggleTheme } from '@workspace/ui/components/utils/ToggleTheme';
import { Separator } from '@workspace/ui/components/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { addSpaceBeforeUppercase, capitalizeFirstLetter } from '@/utils/capitalize';
import { Fragment } from 'react';

export function Header() {
    const pathname = usePathname();

    const segments = pathname.split('/').filter(Boolean);

    const paths = segments.map((segment, index) => ({
        name: capitalizeFirstLetter(addSpaceBeforeUppercase(segment)),
        href: '/' + segments.slice(0, index + 1).join('/'),
        isLast: index === segments.length - 1,
    }));

    return (
        <div
            className={'peer ml-2 mr-2 flex h-14 items-center justify-between gap-3 md:ml-0'}
            data-variant={'inset'}
        >
            <div className={'flex h-full items-center gap-2'}>
                <SidebarTrigger />
                <Separator orientation={'vertical'} className={'!h-1/3'} />
                <Breadcrumb className="cursor-pointer pl-1">
                    <BreadcrumbList>
                        {paths.map(({ name, href, isLast }, index) => (
                            <Fragment key={href}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage>{name}</BreadcrumbPage>
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
            </div>
            <ToggleTheme />
        </div>
    );
}

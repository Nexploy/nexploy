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
import { usePathname } from 'next/navigation';
import { addSpaceBeforeUppercase, capitalizeWords } from '@/utils/capitalize';

const ITEMS_TO_DISPLAY = 2; // Nombre d'items à afficher au début
const MAX_ITEMS_BEFORE_COLLAPSE = 3; // Nombre total d'items avant d'activer la dropdown

export function BreadcrumbPath() {
    const pathname = usePathname();

    const segments = pathname.split('/').filter(Boolean);

    const paths = segments.map((segment, index) => ({
        name: capitalizeWords(addSpaceBeforeUppercase(segment)),
        href: '/' + segments.slice(0, index + 1).join('/'),
        isLast: index === segments.length - 1,
    }));

    // Si pas de paths, ne rien afficher
    if (paths.length === 0) {
        return null;
    }

    // Si le nombre de paths est inférieur ou égal à MAX_ITEMS_BEFORE_COLLAPSE, afficher normalement
    if (paths.length <= MAX_ITEMS_BEFORE_COLLAPSE) {
        return (
            <Breadcrumb className="cursor-pointer pl-1">
                <BreadcrumbList>
                    {paths.map(({ name, href, isLast }) => (
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
        );
    }

    // Sinon, afficher les premiers items, le dropdown avec les items du milieu, et le dernier item
    const firstItems = paths.slice(0, ITEMS_TO_DISPLAY);
    const lastItem = paths[paths.length - 1]!;
    const middleItems = paths.slice(ITEMS_TO_DISPLAY, -1);

    return (
        <Breadcrumb className="cursor-pointer pl-1">
            <BreadcrumbList>
                {/* Premiers items */}
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

                {/* Dropdown avec les items du milieu */}
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

                {/* Dernier item */}
                <BreadcrumbItem>
                    <BreadcrumbPage>{lastItem.name}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}

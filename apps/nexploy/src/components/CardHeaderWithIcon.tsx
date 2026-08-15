import { LucideIcon } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { PropsWithChildren } from 'react';
import { cn } from '@workspace/ui/lib/utils';

interface HeaderWithIconProps {
    isDestructive?: boolean;
    title?: string;
    description?: string;
    icon: LucideIcon;
    as?: 'div' | 'card';
    className?: string;
}

export function CardHeaderWithIcon({
    isDestructive,
    title,
    description,
    icon,
    as = 'card',
    children,
    className,
}: PropsWithChildren<HeaderWithIconProps>) {
    const Icon = icon;

    const Wrapper = as === 'card' ? CardHeader : 'div';

    if (isDestructive)
        return (
            <Wrapper className={cn('flex gap-2 text-destructive', className)}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <Icon className="size-5" />
                </div>
                <div className="flex flex-col">
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {children}
            </Wrapper>
        );

    return (
        <Wrapper className={cn('flex items-center gap-2', className)}>
            <div className={'flex items-center gap-2'}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                </div>
                <div className="flex flex-col">
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
            </div>
            {children}
        </Wrapper>
    );
}

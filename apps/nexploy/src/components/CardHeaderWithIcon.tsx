import { LucideIcon } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { PropsWithChildren } from 'react';
import { cn } from '@workspace/ui/lib/utils.ts';

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
            <Wrapper className={cn('text-destructive flex gap-2', className)}>
                <div className="bg-destructive/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
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
            <div className={'flex items-start gap-2'}>
                <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-primary size-5" />
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

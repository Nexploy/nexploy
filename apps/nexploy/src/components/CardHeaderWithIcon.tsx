import { LucideIcon } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { PropsWithChildren } from 'react';

interface HeaderWithIconProps {
    isDestructive?: boolean;
    title?: string;
    description?: string;
    icon: LucideIcon;
    as?: 'div' | 'card';
}

export function CardHeaderWithIcon({
    isDestructive,
    title,
    description,
    icon,
    as = 'card',
    children,
}: PropsWithChildren<HeaderWithIconProps>) {
    const Icon = icon;

    const Wrapper = as === 'card' ? CardHeader : 'div';

    if (isDestructive)
        return (
            <Wrapper className="text-destructive flex gap-2">
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
        <Wrapper className="flex items-center gap-2">
            <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="text-primary size-5" />
            </div>
            <div className="flex flex-col">
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
            </div>
            {children}
        </Wrapper>
    );
}

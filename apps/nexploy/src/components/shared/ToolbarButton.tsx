import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { LucideIcon } from 'lucide-react';

export function ToolbarButton({
    icon: Icon,
    label,
    onClick,
    disabled,
    disabledReason,
}: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    disabledReason?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" aria-disabled={disabled} onClick={disabled ? undefined : onClick}>
                    <Icon />
                    <span className="sm:hidden md:block">{label}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent className={disabledReason ? undefined : 'hidden sm:block md:hidden'}>
                {disabledReason ?? label}
            </TooltipContent>
        </Tooltip>
    );
}

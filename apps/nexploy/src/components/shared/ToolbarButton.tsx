import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { LucideIcon } from 'lucide-react';

export function ToolbarButton({
    icon: Icon,
    label,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" onClick={onClick}>
                    <Icon />
                    <span className="sm:hidden md:block">{label}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent className="hidden sm:block md:hidden">{label}</TooltipContent>
        </Tooltip>
    );
}

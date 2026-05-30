import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Separator } from '@workspace/ui/components/separator';
import { AICommand } from '@/components/ai/AICommand';
import { BreadcrumbPath } from '@/components/header/BreadcrumbPath';
import { AIPanelToggle } from '@/components/ai/AIPanelToggle';

export function Header() {
    return (
        <div className={'mr-2 ml-2 flex h-14 items-center justify-between gap-3 md:ml-0'}>
            <div className={'flex h-full items-center gap-2'}>
                <SidebarTrigger />
                <Separator orientation={'vertical'} className={'!h-1/3'} />
                <BreadcrumbPath />
            </div>
            <div className="flex items-center">
                <AICommand />
                <AIPanelToggle />
            </div>
        </div>
    );
}

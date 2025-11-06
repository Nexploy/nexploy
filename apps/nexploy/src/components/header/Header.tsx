import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { ToggleTheme } from '@workspace/ui/components/utils/ToggleTheme';
import { Separator } from '@workspace/ui/components/separator';
import { AICommand } from '@/components/ai/AICommand';
import { BreadcrumbPath } from '@/components/header/BreadcrumbPath';

export function Header() {
    return (
        <div
            className={'peer mr-2 ml-2 flex h-14 items-center justify-between gap-3 md:ml-0'}
            data-variant={'inset'}
        >
            <div className={'flex h-full items-center gap-2'}>
                <SidebarTrigger />
                <Separator orientation={'vertical'} className={'!h-1/3'} />
                <BreadcrumbPath />
            </div>
            <AICommand />
            <ToggleTheme />
        </div>
    );
}

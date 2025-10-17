import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar';
import { ToggleTheme } from '@workspace/ui/components/utils/ToggleTheme';
import { Separator } from '@workspace/ui/components/separator';

export default async function AccountLayout({
                                                children
                                            }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <SidebarProvider>
            <AppSidebar variant={'inset'}/>
            <div className={'flex flex-col w-full h-screen'}>
                <div className={'peer mr-2 ml-2 md:ml-0 h-14 gap-3 flex items-center justify-between'}
                     data-variant={'inset'}>
                    <SidebarTrigger/>
                    <div className="flex h-5 items-center space-x-4">
                        <ToggleTheme/>
                        <Separator orientation="vertical"/>
                    </div>
                </div>
                <SidebarInset className="!mt-0 !min-h-0 overflow-hidden">
                    {children}
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

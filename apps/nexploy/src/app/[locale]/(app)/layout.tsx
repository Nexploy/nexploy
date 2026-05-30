import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { Header } from '@/components/header/Header';
import { SSEProvider } from '@/providers/SSEProviders';
import { cookies } from 'next/headers';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { getUserSession } from '@/services/auth/auth.service';
import { ReactNode } from 'react';
import { InsetPanel } from '@/components/layout/InsetPanel';
import { cn } from '@workspace/ui/lib/utils';
import { AIPanelContainer } from '@/components/ai/AIPanelContainer';

export default async function DockerLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const cookieStore = await cookies();

    const hasCookieSidebar = cookieStore.has('sidebar_state');
    const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
    const session = await getUserSession();

    return (
        <PermissionProvider role={session?.user.role}>
            <SidebarProvider defaultOpen={hasCookieSidebar ? defaultOpen : true}>
                <AppSidebar variant={'inset'} />
                <div className={'flex h-screen w-full flex-col'}>
                    <Header />
                    <main className="flex !min-h-0 w-full flex-1 md:pr-2 md:pb-2">
                        <InsetPanel className={cn('flex-1')}>
                            <SSEProvider>{children}</SSEProvider>
                        </InsetPanel>
                        <AIPanelContainer />
                    </main>
                </div>
            </SidebarProvider>
        </PermissionProvider>
    );
}

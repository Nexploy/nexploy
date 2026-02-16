import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { Header } from '@/components/header/Header';
import { SSEProvider } from '@/providers/SSEProviders';
import { cookies } from 'next/headers';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { getUserSession } from '@/services/auth/auth.service';
import { ReactNode } from 'react';

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
                    <SidebarInset className="!mt-0 !min-h-0 overflow-hidden">
                        <SSEProvider>{children}</SSEProvider>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </PermissionProvider>
    );
}

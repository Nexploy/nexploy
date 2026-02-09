import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { Header } from '@/components/header/Header';
import { SSEProvider } from '@/providers/SSEProviders';
import { cookies } from 'next/headers';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { getUserSession } from '@/services/auth/auth.service';

export default async function DockerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
    const session = await getUserSession();

    return (
        <PermissionProvider role={session?.user.role}>
            <SidebarProvider defaultOpen={defaultOpen}>
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

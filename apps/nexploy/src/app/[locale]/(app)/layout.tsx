import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { Header } from '@/components/Header';
import { SSEProvider } from '@/providers/SSEProviders';
import { cookies } from 'next/headers';

export default async function DockerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar variant={'inset'} />
            <div className={'flex h-screen w-full flex-col'}>
                <Header />
                <SidebarInset className="!mt-0 !min-h-0 overflow-hidden">
                    <SSEProvider>{children}</SSEProvider>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { Header } from '@/components/Header';
import { SSEProvider } from '@/providers/SSEProviders';

export default async function DockerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
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

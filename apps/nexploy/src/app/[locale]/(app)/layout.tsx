import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { Header } from '@/components/Header';

export default async function AccountLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <AppSidebar variant={'inset'} />
            <div className={'flex h-screen w-full flex-col'}>
                <Header />
                <SidebarInset className="!mt-0 !min-h-0 overflow-hidden">{children}</SidebarInset>
            </div>
        </SidebarProvider>
    );
}

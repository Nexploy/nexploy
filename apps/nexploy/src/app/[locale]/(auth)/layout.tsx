import { NexployLogo } from '@/components/sidebar/NexployLogo';

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <div className={'absolute m-4 flex items-center gap-2'}>
                <NexployLogo className="size-7" />
                <h1 className={'text-2xl font-extrabold'}>Nexploy</h1>
            </div>
            {children}
        </div>
    );
}

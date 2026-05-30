import Image from 'next/image';

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <div className={'absolute m-4 flex items-center gap-2'}>
                <Image
                    src="/assets/nexploy-logo.svg"
                    className="size-7 shrink-0 dark:invert"
                    alt="Nexploy Logo"
                    width={28}
                    height={28}
                />
                <h1 className={'text-2xl font-extrabold'}>Nexploy</h1>
            </div>
            {children}
        </div>
    );
}

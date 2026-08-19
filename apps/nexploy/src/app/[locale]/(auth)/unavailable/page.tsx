import { getTranslations } from 'next-intl/server';
import { DatabaseZap } from 'lucide-react';
import type { Metadata } from 'next';
import { buttonVariants } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Service unavailable',
};

export default async function UnavailablePage() {
    const t = await getTranslations('auth.unavailable');

    return (
        <div className="flex min-h-screen items-center justify-center p-5">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10">
                        <DatabaseZap className="size-7 text-destructive" />
                    </div>
                    <h1 className="font-semibold text-2xl tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                    <p className="text-muted-foreground text-xs">{t('hint')}</p>
                    <a href="/" className={buttonVariants({ variant: 'outline' })}>
                        {t('retry')}
                    </a>
                </CardContent>
            </Card>
        </div>
    );
}

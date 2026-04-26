import type { Metadata } from 'next';
import Link from 'next/link';
import { TwoFactorVerifCodeForm } from '@/components/auth/2faVerifCodeForm';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Two-Factor Authentication',
        description: 'Verify your two-factor authentication code',
    };
}

export default async function TwoFactoVerifCodePage() {
    const t = await getTranslations('auth.twoFactor');

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">{t('codeLabel')}</CardTitle>
                    <CardDescription>
                        {t('description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TwoFactorVerifCodeForm />
                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            {t('cantAccessAuthApp')}{' '}
                        </span>
                        <Link
                            href="/2fa/backup-codes"
                            className="text-primary font-medium hover:underline"
                        >
                            {t('useBackupCode')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

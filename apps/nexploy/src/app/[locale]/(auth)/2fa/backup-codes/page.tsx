import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@workspace/ui/components/card';
import { TwoFactorUseBackupCodeForm } from '@/components/auth/2faUseBackupCodeForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { getTranslations } from 'next-intl/server';

export default async function TwoFactoVerifCodePage() {
    const t = await getTranslations('auth.twoFactor');

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card>
                <CardHeader>
                    <div className={'flex items-center gap-2'}>
                        <Button className={'mx-0 w-0 px-0'} variant="ghost" size="sm" asChild>
                            <Link href="/auth/2fa">
                                <ArrowLeft className={'!size-5'} />
                            </Link>
                        </Button>
                        <CardTitle className="text-2xl">{t('backupCodeTitle')}</CardTitle>
                    </div>
                    <CardDescription>{t('backupCodeDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TwoFactorUseBackupCodeForm />
                </CardContent>
            </Card>
        </div>
    );
}

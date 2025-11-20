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

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Two-Factor Authentication',
        description: 'Verify your two-factor authentication code',
    };
}

export default async function TwoFactoVerifCodePage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Verification Code</CardTitle>
                    <CardDescription>
                        Enter the 6-digit code displayed in your authenticator app
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TwoFactorVerifCodeForm />
                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            Can't access your authenticator app?{' '}
                        </span>
                        <Link
                            href="/2fa/backup-codes"
                            className="text-primary font-medium hover:underline"
                        >
                            Use a backup code
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

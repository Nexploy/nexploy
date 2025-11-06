import { SetupForm } from '@/components/auth/SetupForm';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Setup',
        description: 'Configurez votre compte Nexploy',
    };
}

export default async function SigninPage() {
    return <SetupForm />;
}

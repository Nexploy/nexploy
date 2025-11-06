import { SignInForm } from '@/components/auth/SignInForm';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Sign In',
        description: 'Connectez-vous à votre compte Nexploy',
    };
}

export default async function SigninPage() {
    return <SignInForm />;
}

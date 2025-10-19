'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { useRouter } from '@/i18n/navigation';
import { GithubIcon } from 'lucide-react';
import Link from 'next/link';

export default function SigninPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleEmailSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await authClient.signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || 'Une erreur est survenue');
            } else {
                router.push('/projects');
            }
        } catch (err) {
            setError('Une erreur est survenue lors de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubSignin = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: 'github',
                callbackURL: '/projects',
            });
        } catch (err) {
            setError('Une erreur est survenue lors de la connexion avec GitHub');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Connexion</CardTitle>
                    <CardDescription>Connectez-vous à votre compte pour continuer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleEmailSignin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="vous@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {error && <div className="text-destructive text-sm">{error}</div>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card text-muted-foreground px-2">
                                Ou continuer avec
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        className="w-full"
                        onClick={handleGithubSignin}
                        disabled={isLoading}
                    >
                        <GithubIcon className="h-4 w-4" />
                        GitHub
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-muted-foreground text-sm">
                        Pas encore de compte ?{' '}
                        <Link href="/signup" className="text-primary hover:underline">
                            S'inscrire
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

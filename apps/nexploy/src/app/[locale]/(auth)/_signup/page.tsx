'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from '@/i18n/navigation';
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
import Link from 'next/link';

type SignupFormValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function SignupPage() {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>();
    const [error, setError] = useState('');
    const router = useRouter();

    const passwordValue = watch('password');

    const onSubmit = async (data: SignupFormValues) => {
        setError('');

        if (data.password !== data.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const result = await authClient.signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
            });

            if (result.error) {
                setError(result.error.message || 'Une erreur est survenue');
            } else {
                router.push('/projects');
            }
        } catch (err) {
            setError("Une erreur est survenue lors de l'inscription");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Créer un compte</CardTitle>
                    <CardDescription>
                        Inscrivez-vous pour commencer à utiliser Nexploy
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Votre nom"
                                {...register('name', { required: 'Le nom est requis' })}
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <span className="text-destructive text-sm">
                                    {errors.name.message}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="vous@exemple.com"
                                {...register('email', { required: 'L’email est requis' })}
                                disabled={isSubmitting}
                            />
                            {errors.email && (
                                <span className="text-destructive text-sm">
                                    {errors.email.message}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password', {
                                    required: 'Le mot de passe est requis',
                                    minLength: { value: 6, message: 'Minimum 6 caractères' },
                                })}
                                disabled={isSubmitting}
                            />
                            {errors.password && (
                                <span className="text-destructive text-sm">
                                    {errors.password.message}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                {...register('confirmPassword', {
                                    required: 'Veuillez confirmer votre mot de passe',
                                    validate: (value) =>
                                        value === passwordValue ||
                                        'Les mots de passe ne correspondent pas',
                                })}
                                disabled={isSubmitting}
                            />
                            {errors.confirmPassword && (
                                <span className="text-destructive text-sm">
                                    {errors.confirmPassword.message}
                                </span>
                            )}
                        </div>

                        {error && <div className="text-destructive text-sm">{error}</div>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Inscription...' : "S'inscrire"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-muted-foreground text-sm">
                        Vous avez déjà un compte ?{' '}
                        <Link href="/signin" className="text-primary hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

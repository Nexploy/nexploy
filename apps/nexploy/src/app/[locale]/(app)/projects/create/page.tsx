'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Folder, GitBranch, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { projectCreateFormSchema } from '@workspace/schemas-zod/project/projectCreate.schema';
import { onProjectCreateAction } from '@/actions/project/projectCreate.action';
import { Optional } from '@workspace/ui/components/utils/Optional';
import { Textarea } from '@workspace/ui/components/textarea';

export default function AddProjectPage() {
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onProjectCreateAction,
        zodResolver(projectCreateFormSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    description: '',
                    repositoryUrl: '',
                    branch: 'main',
                    gitToken: '',
                    buildType: 'DOCKERFILE',
                    dockerfilePath: 'Dockerfile',
                    contextPath: '.',
                    buildArgs: '',
                    autoDeploy: true,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) router.push(`/projects/${data}`);
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';
    const buildType = form.watch('buildType');

    return (
        <div className="flex flex-1 flex-col gap-5 overflow-hidden pt-5">
            <div className="flex justify-between gap-4 px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Folder className="text-primary size-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Nouveau projet
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Créer et déployer une nouvelle application depuis Git
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        icon={ArrowLeft}
                        onClick={router.back}
                        disabled={isSubmitting}
                    >
                        Retour
                    </Button>
                    <Button
                        type="submit"
                        icon={Plus}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleSubmitWithAction}
                    >
                        {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                    </Button>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <div className="space-y-5 px-5 pb-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations générales</CardTitle>
                                <CardDescription>Détails de base de votre projet</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom du projet</FormLabel>
                                            <FormControl>
                                                <Input placeholder="mon-super-projet" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Un nom unique pour identifier votre projet
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Description <Optional />
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Une courte description de votre projet..."
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Source Git</CardTitle>
                                <CardDescription>Configuration du dépôt source</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="repositoryUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL du dépôt Git</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://github.com/username/repo.git"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid items-start gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="branch"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Branche</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <GitBranch className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                                        <Input
                                                            className="pl-9"
                                                            placeholder="main"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="gitToken"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Token d'accès <Optional />
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ghp_..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration de Build</CardTitle>
                                <CardDescription>
                                    Comment votre application doit être construite
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="buildType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type de build</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner un type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DOCKERFILE">
                                                        Dockerfile
                                                    </SelectItem>
                                                    <SelectItem value="NIXPACKS">
                                                        Nixpacks
                                                    </SelectItem>
                                                    <SelectItem value="BUILDPACKS">
                                                        Buildpacks
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {buildType === 'DOCKERFILE' && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="dockerfilePath"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Chemin du Dockerfile</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Dockerfile"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="contextPath"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contexte de build</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Déploiement</CardTitle>
                                <CardDescription>
                                    Paramètres de déploiement automatique
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="autoDeploy"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-base">
                                                        Déploiement automatique
                                                    </span>
                                                    <FormDescription className="m-0">
                                                        Déployer automatiquement lors d'un push sur
                                                        la branche
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </Label>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}

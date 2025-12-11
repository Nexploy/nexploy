'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Hammer, Save } from 'lucide-react';
import { Repository } from 'generated/client';
import {
    Form,
    FormControl,
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
import { Button } from '@workspace/ui/components/button';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { BuildType, buildTypeSchema } from '@workspace/schemas-zod/repository/buildType.schema';
import { updateBuildTypeAction } from '@/actions/repository/settings/updateBuildType.action';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

interface ChangeBuildTypeProps {
    repository: Repository;
}

const buildTypeOptions: { value: BuildType; label: string; description: string }[] = [
    {
        value: 'DOCKERFILE',
        label: 'Dockerfile',
        description: 'Utiliser un Dockerfile existant',
    },
    {
        value: 'DOCKER_COMPOSE',
        label: 'Docker Compose',
        description: 'Utiliser un fichier docker-compose.yml',
    },
    {
        value: 'NIXPACKS',
        label: 'Nixpacks',
        description: 'Build automatique avec Nixpacks',
    },
    {
        value: 'BUILDPACKS',
        label: 'Buildpacks',
        description: 'Build automatique avec Cloud Native Buildpacks',
    },
];

export function ChangeBuildType({ repository }: ChangeBuildTypeProps) {
    const bindUpdateBuildTypeAction = updateBuildTypeAction.bind(null, repository.id);
    const { form, action, handleSubmitWithAction } = useHookFormAction(
        bindUpdateBuildTypeAction,
        zodResolver(buildTypeSchema),
        {
            formProps: {
                defaultValues: {
                    buildType: repository.buildType,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) form.reset({ buildType: data });
                },
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Hammer}
                title={'Type de build'}
                description={'Choisissez la méthode de build pour votre application'}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="buildType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type de build</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="min-w-48">
                                                <SelectValue placeholder="Sélectionner un type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {buildTypeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                icon={Save}
                                disabled={action.isPending || !form.formState.isDirty}
                            >
                                {action.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

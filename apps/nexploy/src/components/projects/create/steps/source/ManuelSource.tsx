'use client';

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Optional } from '@workspace/ui/components/utils/Optional';
import { GitBranch as GitBranchIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

export function ManuelSource() {
    const { control } = useFormContext();

    return (
        <div className="space-y-4 pt-4">
            <FormField
                control={control}
                name="repositoryUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>URL du dépôt Git</FormLabel>
                        <FormControl>
                            <Input placeholder="https://github.com/username/repo.git" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid items-start gap-4 md:grid-cols-2">
                <FormField
                    control={control}
                    name="branch"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Branche</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <GitBranchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                    <Input className="pl-9" placeholder="main" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="gitToken"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Token d&apos;accès <Optional />
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="ghp_..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}

'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Layers, Rocket, Upload } from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { useTheme } from '@wrksz/themes/client';
import { Button } from '@workspace/ui/components/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { deployComposeSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { onComposeDeployAction } from '@/actions/docker/composes/composeDeployAction';
import { useTranslations } from 'next-intl';
import { BackButton } from '@/components/shared/BackButton';

const EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    tabSize: 2,
    smoothScrolling: true,
    cursorBlinking: 'smooth' as const,
    padding: { top: 12, bottom: 12 },
    automaticLayout: true,
};

const DEFAULT_COMPOSE = `services:
  web:
    image: hello-world:latest
    restart: unless-stopped
`;

export default function CreateStack() {
    const router = useRouter();
    const t = useTranslations('docker.createStack');
    const { theme } = useTheme();
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs-light';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sanitizeProjectName = (value: string) =>
        value
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/^[^a-z0-9]+/, '');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onComposeDeployAction,
        zodResolver(deployComposeSchema),
        {
            formProps: {
                defaultValues: {
                    stackName: '',
                    yaml: DEFAULT_COMPOSE,
                },
            },
            actionProps: {
                onExecute: () => {
                    toast.loading(t('deploying'), { id: 'stack-deploy' });
                },
                onSuccess: ({ data }) => {
                    toast.dismiss('stack-deploy');
                    if (data?.success) {
                        toast.success(t('deploySuccess', { name: data.stackName }));
                        router.push('/docker/containers');
                    }
                },
                onError: () => {
                    toast.dismiss('stack-deploy');
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === 'string') {
                form.setValue('yaml', content, { shouldValidate: true });
                if (!form.getValues('stackName')) {
                    const base = sanitizeProjectName(file.name.replace(/\.(ya?ml)$/i, ''));
                    if (base) form.setValue('stackName', base, { shouldValidate: true });
                }
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <Form {...form}>
                <form
                    className="flex flex-1 flex-col overflow-hidden"
                    onSubmit={handleSubmitWithAction}
                >
                    <div className="mb-5 flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <Layers className="text-primary size-7" />
                            </div>
                            <div className="mt-3.5 flex flex-col">
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    {t('title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">{t('description')}</p>
                            </div>
                        </div>
                        <div className="mt-5 flex gap-3">
                            <BackButton disabled={isSubmitting} />
                            <Button
                                type="submit"
                                icon={Rocket}
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('deploying') : t('deployButton')}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
                        <Card>
                            <CardHeaderWithIcon
                                icon={Layers}
                                title={t('stackConfig')}
                                description={t('stackConfigDescription')}
                            />
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="stackName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('stackName')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('stackNamePlaceholder')}
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            sanitizeProjectName(e.target.value),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {t('stackNameDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className={'flex-1'}>
                            <CardHeaderWithIcon
                                icon={Layers}
                                title={t('composeFile')}
                                description={t('composeFileDescription')}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".yml,.yaml,text/yaml"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    icon={Upload}
                                    className="ml-auto"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {t('uploadFile')}
                                </Button>
                            </CardHeaderWithIcon>
                            <CardContent className="flex-1">
                                <FormField
                                    control={form.control}
                                    name="yaml"
                                    render={({ field }) => (
                                        <FormItem className="h-full">
                                            <FormControl>
                                                <div className="flex-1 overflow-hidden rounded-lg border">
                                                    <Editor
                                                        height="100%"
                                                        language="yaml"
                                                        value={field.value}
                                                        onChange={(v) => field.onChange(v ?? '')}
                                                        options={EDITOR_OPTIONS}
                                                        theme={monacoTheme}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </Form>
        </div>
    );
}

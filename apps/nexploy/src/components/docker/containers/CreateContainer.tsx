'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray } from 'react-hook-form';
import {
    ArrowLeft,
    Circle,
    Container,
    Database,
    Database as MySQL,
    Leaf,
    Plus,
    Trash2,
} from 'lucide-react';
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
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { onContainerCreateAction } from '@/actions/docker/container/containerCreate.action';
import {
    InputAutoComplete,
    InputAutoCompleteOption,
} from '@workspace/ui/components/search-command';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';

const CONTAINER_TEMPLATES = [
    {
        name: 'PostgreSQL',
        icon: Database,
        descriptionKey: 'templatePostgres' as const,
        categoryKey: 'categoryDatabase' as const,
        config: {
            name: 'postgres',
            image: 'postgres:16',
            restart: 'unless-stopped',
            ports: [{ hostPort: '5432', containerPort: '5432', protocol: 'tcp' }],
            envVars: [
                { key: 'POSTGRES_USER', value: 'postgres' },
                { key: 'POSTGRES_PASSWORD', value: 'password' },
                { key: 'POSTGRES_DB', value: 'mydb' },
            ],
            volumes: [
                {
                    hostPath: 'postgres-data',
                    containerPath: '/var/lib/postgresql/data',
                    readOnly: false,
                },
            ],
        },
    },
    {
        name: 'Redis',
        icon: Circle,
        descriptionKey: 'templateRedis' as const,
        categoryKey: 'categoryCache' as const,
        config: {
            name: 'redis',
            image: 'redis:7-alpine',
            restart: 'unless-stopped',
            ports: [{ hostPort: '6379', containerPort: '6379', protocol: 'tcp' }],
            envVars: [],
            volumes: [{ hostPath: 'redis-data', containerPath: '/data', readOnly: false }],
        },
    },
    {
        name: 'MySQL',
        icon: MySQL,
        descriptionKey: 'templateMysql' as const,
        categoryKey: 'categoryDatabase' as const,
        config: {
            name: 'mysql',
            image: 'mysql:8',
            restart: 'unless-stopped',
            ports: [{ hostPort: '3306', containerPort: '3306', protocol: 'tcp' }],
            envVars: [
                { key: 'MYSQL_ROOT_PASSWORD', value: 'rootpassword' },
                { key: 'MYSQL_DATABASE', value: 'mydb' },
                { key: 'MYSQL_USER', value: 'user' },
                { key: 'MYSQL_PASSWORD', value: 'password' },
            ],
            volumes: [{ hostPath: 'mysql-data', containerPath: '/var/lib/mysql', readOnly: false }],
        },
    },
    {
        name: 'MongoDB',
        icon: Leaf,
        descriptionKey: 'templateMongodb' as const,
        categoryKey: 'categoryDatabase' as const,
        config: {
            name: 'mongodb',
            image: 'mongo:7',
            restart: 'unless-stopped',
            ports: [{ hostPort: '27017', containerPort: '27017', protocol: 'tcp' }],
            envVars: [
                { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
                { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'password' },
            ],
            volumes: [{ hostPath: 'mongo-data', containerPath: '/data/db', readOnly: false }],
        },
    },
] as const;

interface CreateContainerProps {
    listImages: InputAutoCompleteOption[];
}

export default function CreateContainer({ listImages }: CreateContainerProps) {
    const router = useRouter();
    const t = useTranslations('docker.createContainer');
    const tCommon = useTranslations('common');

    const searchParams = useSearchParams();
    const imageFromUrl = searchParams.get('image') || '';

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onContainerCreateAction,
        zodResolver(containerCreateFormSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    image: imageFromUrl,
                    restart: 'unless-stopped',
                    network: '',
                    hostname: '',
                    autoRemove: false,
                    privileged: false,
                    ports: [],
                    envVars: [],
                    volumes: [],
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) router.push(`/docker/containers/${data.id}`);
                },
            },
        },
    );

    const {
        fields: portsFields,
        append: appendPort,
        remove: removePort,
    } = useFieldArray({
        control: form.control,
        name: 'ports',
    });

    const {
        fields: envVarsFields,
        append: appendEnvVar,
        remove: removeEnvVar,
    } = useFieldArray({
        control: form.control,
        name: 'envVars',
    });

    const {
        fields: volumesFields,
        append: appendVolume,
        remove: removeVolume,
    } = useFieldArray({
        control: form.control,
        name: 'volumes',
    });

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex justify-between gap-4 px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Container className="text-primary size-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
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
                        {t('back')}
                    </Button>
                    <Button
                        type="submit"
                        icon={Plus}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleSubmitWithAction}
                    >
                        {isSubmitting ? t('creating') : t('createButton')}
                    </Button>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <div className="space-y-5 px-5 pb-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('templates')}</CardTitle>
                                <CardDescription>{t('templatesDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {CONTAINER_TEMPLATES.map((template) => (
                                    <Card
                                        key={template.name}
                                        onClick={() =>
                                            form.reset({
                                                ...template.config,
                                                ports: template.config.ports.map((port) => ({
                                                    ...port,
                                                })),
                                                envVars: template.config.envVars.map((env) => ({
                                                    ...env,
                                                })),
                                                volumes: template.config.volumes.map((volume) => ({
                                                    ...volume,
                                                })),
                                            })
                                        }
                                        className={cn(
                                            'hover:border-primary flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-50',
                                            form.watch('image') === template.config.image &&
                                                'border-primary/70',
                                        )}
                                    >
                                        <CardHeader className={'px-0'}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-md">
                                                    <template.icon className="text-primary size-5" />
                                                </div>
                                                <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
                                                    {t(template.categoryKey)}
                                                </span>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex flex-col gap-2 px-0">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-semibold">
                                                    {template.name}
                                                </h3>
                                                <p className="text-muted-foreground line-clamp-1 text-xs">
                                                    {t(template.descriptionKey)}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('basicConfig')}</CardTitle>
                                <CardDescription>{t('basicConfigDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('containerName')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('containerNamePlaceholder')}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {t('containerNameDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('dockerImage')}</FormLabel>
                                            <FormControl>
                                                <InputAutoComplete
                                                    options={listImages}
                                                    heading={t('availableImages')}
                                                    autoComplete="off"
                                                    placeholder="postgres:latest"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {t('dockerImageDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="hostname"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t('hostname')}{' '}
                                                    <span className="text-muted-foreground text-xs">
                                                        {tCommon('optional')}
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('hostnamePlaceholder')}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="network"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t('network')}{' '}
                                                    <span className="text-muted-foreground text-xs">
                                                        {tCommon('optional')}
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('networkPlaceholder')}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="restart"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('restartPolicy')}</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue
                                                            placeholder={t('selectPolicy')}
                                                        />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="no">
                                                        {t('restartNever')}
                                                    </SelectItem>
                                                    <SelectItem value="always">
                                                        {t('restartAlways')}
                                                    </SelectItem>
                                                    <SelectItem value="on-failure">
                                                        {t('restartOnFailure')}
                                                    </SelectItem>
                                                    <SelectItem value="unless-stopped">
                                                        {t('restartUnlessStopped')}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="autoRemove"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-base">
                                                            {t('autoRemove')}
                                                        </span>
                                                        <FormDescription className="m-0">
                                                            {t('autoRemoveDescription')}
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

                                    <FormField
                                        control={form.control}
                                        name="privileged"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-base">
                                                            {t('privilegedMode')}
                                                        </span>
                                                        <FormDescription className="m-0">
                                                            {t('privilegedModeDescription')}
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
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t('ports')}</CardTitle>
                                        <CardDescription>{t('portsDescription')}</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            appendPort({
                                                hostPort: '',
                                                containerPort: '',
                                                protocol: 'tcp',
                                            })
                                        }
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('addPort')}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {portsFields.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        {t('noPortsConfigured')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {portsFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`ports.${index}.hostPort`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t('hostPort')}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <span className="text-muted-foreground">→</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`ports.${index}.containerPort`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t('containerPort')}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`ports.${index}.protocol`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Select
                                                                    value={field.value}
                                                                    onValueChange={field.onChange}
                                                                >
                                                                    <SelectTrigger className="w-24">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="tcp">
                                                                            TCP
                                                                        </SelectItem>
                                                                        <SelectItem value="udp">
                                                                            UDP
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructiveGhost"
                                                    size="icon"
                                                    onClick={() => removePort(index)}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t('envVars')}</CardTitle>
                                        <CardDescription>{t('envVarsDescription')}</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => appendEnvVar({ key: '', value: '' })}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('addVariable')}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {envVarsFields.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        {t('noEnvVarsConfigured')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {envVarsFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`envVars.${index}.key`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t(
                                                                        'keyPlaceholder',
                                                                    )}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <span className="text-muted-foreground">=</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`envVars.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t(
                                                                        'valuePlaceholder',
                                                                    )}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructiveGhost"
                                                    size="icon"
                                                    onClick={() => removeEnvVar(index)}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t('volumes')}</CardTitle>
                                        <CardDescription>{t('volumesDescription')}</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            appendVolume({
                                                hostPath: '',
                                                containerPath: '',
                                                readOnly: false,
                                            })
                                        }
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('addVolume')}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {volumesFields.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        {t('noVolumesConfigured')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {volumesFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`volumes.${index}.hostPath`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t('hostPath')}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <span className="text-muted-foreground">→</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`volumes.${index}.containerPath`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t('containerPath')}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`volumes.${index}.readOnly`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={
                                                                            field.onChange
                                                                        }
                                                                    />
                                                                    <Label className="text-xs">
                                                                        {t('readOnly')}
                                                                    </Label>
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructiveGhost"
                                                    size="icon"
                                                    onClick={() => removeVolume(index)}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}

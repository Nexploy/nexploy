import { zodResolver } from '@hookform/resolvers/zod';
import { type Resolver, useForm } from 'react-hook-form';
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import {
    ContainerPortForm,
    containerPortSchema,
} from '@workspace/schemas-zod/docker/container/containerPort.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { Plus, Save, Trash } from 'lucide-react';
import { PortFormProps } from '@workspace/typescript-interface/docker/docker.port';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { useTranslations } from 'next-intl';

export function PortForm({ mode, defaultPort, originalPort }: PortFormProps) {
    const { closeDialog } = useConfirmationDialogStore();
    const { onPortChange } = useContainerChangesStore();
    const t = useTranslations('docker.forms');
    const tCommon = useTranslations('common');

    const form = useForm<ContainerPortForm>({
        resolver: zodResolver(containerPortSchema) as Resolver<ContainerPortForm>,
        defaultValues: {
            privatePort: defaultPort?.privatePort ?? 80,
            publicPort: defaultPort?.publicPort ?? 8080,
            type: defaultPort?.type ?? 'tcp',
        },
    });

    const onSubmit = (data: ContainerPortForm) => {
        const { publicPort, privatePort, type } = containerPortSchema.parse(data);

        if (mode === 'add') {
            onPortChange({
                typeAction: 'add',
                publicPort,
                privatePort,
                type,
            });
        } else if (mode === 'edit') {
            const referencePort = originalPort ?? defaultPort;

            onPortChange({
                typeAction: 'edit',
                publicPort,
                privatePort,
                type,
                currentPublicPort: referencePort?.publicPort,
                currentPrivatePort: referencePort?.privatePort,
                currentType: referencePort?.type,
            });
        }

        closeDialog();
    };

    const handleDelete = () => {
        if (!defaultPort) return;

        const referencePort = originalPort ?? defaultPort;

        onPortChange({
            typeAction: 'delete',
            currentPublicPort: referencePort.publicPort,
            currentPrivatePort: referencePort.privatePort,
            currentType: referencePort.type,
        });

        closeDialog();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="publicPort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('port.hostPort')}
                                <span className="text-muted-foreground text-xs">
                                    {tCommon('optional')}
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input {...field} type="number" placeholder="8080" />
                            </FormControl>
                            <FormDescription className="text-xs">
                                {t('port.hostPortDescription')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="privatePort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('port.containerPort')}</FormLabel>
                            <FormControl>
                                <Input {...field} type="number" placeholder="80" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('port.protocol')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('port.selectProtocol')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('port.protocol')}</SelectLabel>
                                        <SelectItem value="tcp">TCP</SelectItem>
                                        <SelectItem value="udp">UDP</SelectItem>
                                        <SelectItem value="sctp">SCTP</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="flex !justify-between pt-4">
                    {mode === 'edit' && (
                        <Button
                            size="icon"
                            type="button"
                            variant="destructive"
                            icon={Trash}
                            onClick={handleDelete}
                        />
                    )}
                    <div className="flex flex-1 flex-row justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">{t('cancel')}</Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={!form.formState.isDirty}
                            icon={mode === 'add' ? Plus : Save}
                        >
                            {mode === 'add' ? t('add') : t('edit')}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
}

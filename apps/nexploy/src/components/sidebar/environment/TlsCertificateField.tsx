'use client';

import { useCallback, useState } from 'react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ShieldCheck, Upload } from 'lucide-react';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { DragAndDrop } from '@workspace/ui/components/drag-and-drop';
import type { UseFormReturn } from 'react-hook-form';

const TLS_EXTENSIONS = ['.pem', '.crt', '.key', '.cert', '.ca-bundle'];

interface TlsCertificateFieldProps {
    form: UseFormReturn<any>;
    name: 'tlsCert' | 'tlsKey' | 'tlsCa';
    label: string;
    placeholder: string;
    disabled?: boolean;
    hasExistingValue?: boolean;
}

export function TlsCertificateField({
    form,
    name,
    label,
    placeholder,
    disabled,
    hasExistingValue,
}: TlsCertificateFieldProps) {
    const t = useTranslations('docker.environmentForm');
    const [showUpload, setShowUpload] = useState(false);

    const handleFileContent = useCallback(
        (content: string) => {
            form.setValue(name, content || undefined, { shouldValidate: true });
        },
        [form, name],
    );

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => {
                const hasNewValue = !!field.value;
                const showConfiguredBadge = hasExistingValue && !hasNewValue && !showUpload;

                return (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            <Tabs defaultValue="file" className="w-full">
                                <TabsList className="mb-2 w-full">
                                    <TabsTrigger value="file">
                                        <Upload className="h-3.5 w-3.5" />
                                        {t('modeFile')}
                                    </TabsTrigger>
                                    <TabsTrigger value="paste">{t('modePaste')}</TabsTrigger>
                                </TabsList>

                                <TabsContent value="file">
                                    {showConfiguredBadge ? (
                                        <div className="border-muted-foreground/25 flex items-center gap-2 rounded-lg border-2 border-dashed p-3">
                                            <ShieldCheck className="text-muted-foreground h-4 w-4 shrink-0" />
                                            <span className="text-muted-foreground flex-1 text-xs">
                                                {t('certAlreadyConfigured')}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs"
                                                disabled={disabled}
                                                onClick={() => setShowUpload(true)}
                                            >
                                                {t('certReplace')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <DragAndDrop
                                            onFileContent={handleFileContent}
                                            accept={TLS_EXTENSIONS}
                                            dropText={t('dropZoneText')}
                                            formatsText={t('dropZoneFormats')}
                                            disabled={disabled}
                                        />
                                    )}
                                </TabsContent>

                                <TabsContent value="paste">
                                    <Textarea
                                        placeholder={
                                            hasExistingValue && !hasNewValue
                                                ? t('certAlreadyConfiguredPaste')
                                                : placeholder
                                        }
                                        {...field}
                                        disabled={disabled}
                                        rows={4}
                                        className="font-mono text-xs"
                                    />
                                </TabsContent>
                            </Tabs>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
}

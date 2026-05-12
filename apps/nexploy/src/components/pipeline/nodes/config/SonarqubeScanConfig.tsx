'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
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
import { Switch } from '@workspace/ui/components/switch';

export function SonarqubeScanConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const mode = form.watch('mode');

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sonarqubeMode')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('sonarqubeMode')}</SelectLabel>
                                    <SelectItem value="local">{t('sonarqubeModeLocal')}</SelectItem>
                                    <SelectItem value="custom">
                                        {t('sonarqubeModeCustom')}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            {mode === 'custom' && (
                <FormField
                    control={form.control}
                    name="serverUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sonarqubeServerUrl')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="https://sonarcloud.io" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
            {mode === 'custom' && (
                <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sonarqubeOrganization')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="my-org" />
                            </FormControl>
                            <FormDescription className="text-xs">
                                {t('sonarqubeOrganizationDescription')}
                            </FormDescription>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
            {mode === 'local' && (
                <FormField
                    control={form.control}
                    name="sonarqubeVersion"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sonarqubeVersion')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="community" />
                            </FormControl>
                            <FormDescription className="text-xs">
                                {t('sonarqubeVersionDescription')}
                            </FormDescription>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
            {mode === 'local' && (
                <FormField
                    control={form.control}
                    name="sonarqubePort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sonarqubePort')}</FormLabel>
                            <FormControl>
                                <Input {...field} type="number" min={1} max={65535} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="projectKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sonarqubeProjectKey')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="my-project" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sonarqubeToken')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormDescription className="text-xs">
                            {t('sonarqubeTokenDescription')}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="sources"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sonarqubeSources')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="." />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="exclusions"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sonarqubeExclusions')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="**/*.test.ts,**/node_modules/**" />
                        </FormControl>
                        <FormDescription className="text-xs">
                            {t('sonarqubeExclusionsDescription')}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="timeoutSeconds"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('timeoutSeconds')}</FormLabel>
                        <FormControl>
                            <Input {...field} type="number" min={30} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="qualityGate"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-2">
                        <div>
                            <FormLabel>{t('sonarqubeQualityGate')}</FormLabel>
                            <FormDescription className="text-xs">
                                {t('sonarqubeQualityGateDescription')}
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}

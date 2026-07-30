'use client';

import { useTranslations } from 'next-intl';
import { useLocalStorage } from 'usehooks-ts';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { refreshRateOptions } from '@/utils/refreshRate';

export function MonitoringRefreshRateSelect() {
    const t = useTranslations('monitoring');
    const [refreshRate, setRefreshRate] = useLocalStorage('stats-refreshRate', '5000');

    return (
        <Select value={refreshRate} onValueChange={setRefreshRate}>
            <SelectTrigger>
                <SelectValue placeholder={t('refreshRate')} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{t('refreshRate')}</SelectLabel>
                    {refreshRateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}

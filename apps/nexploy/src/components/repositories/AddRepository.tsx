import { Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function AddRepository() {
    const t = useTranslations('repository');
    return (
        <Button asChild>
            <Link href={'/repositories/create'}>
                <Plus />
                {t('addRepository')}
            </Link>
        </Button>
    );
}

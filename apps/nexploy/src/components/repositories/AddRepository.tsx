import { Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export function AddRepository() {
    return (
        <Button asChild>
            <Link href={'/repositories/create'}>
                <Plus />
                Ajouter un repository
            </Link>
        </Button>
    );
}

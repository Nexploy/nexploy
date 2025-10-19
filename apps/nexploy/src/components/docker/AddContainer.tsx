import { Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export function AddContainer() {
    return (
        <Button asChild>
            <Link className={'mt-1'} href={'/docker/containers/addContainer'}>
                <Plus />
                Ajouter un conteneur
            </Link>
        </Button>
    );
}

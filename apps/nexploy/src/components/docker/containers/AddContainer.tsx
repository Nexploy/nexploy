import { Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export function AddContainer() {
    return (
        <Button asChild>
            <Link href={'/docker/containers/add-container'}>
                <Plus />
                Ajouter un conteneur
            </Link>
        </Button>
    );
}

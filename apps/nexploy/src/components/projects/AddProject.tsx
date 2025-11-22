import { Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export function AddProject() {
    return (
        <Button asChild>
            <Link href={'/projects/create'}>
                <Plus />
                Ajouter un projet
            </Link>
        </Button>
    );
}

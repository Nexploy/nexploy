import { getUserEnvironments } from '@/services/environment/environment.service';
import { DropdownEnvironment } from '@/components/sidebar/environment/DropdownEnvironment';

export async function Environment() {
    const environments = await getUserEnvironments();

    return <DropdownEnvironment environments={environments} />;
}

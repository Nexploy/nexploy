import { getUserSession } from '@/services/auth/auth.service';
import { AccountMenuClient } from '@/components/sidebar/AccountMenuClient';

export async function AccountMenu() {
    const session = await getUserSession();

    return <AccountMenuClient session={session} />;
}

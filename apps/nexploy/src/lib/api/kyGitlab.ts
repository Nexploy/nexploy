import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export function kyGitlab(baseUrl: string, explicitToken?: string) {
    return ky.create({
        prefixUrl: `${baseUrl}/api`,
        hooks: {
            beforeRequest: [
                (request) => {
                    const accessToken = explicitToken ?? getTokenGitStorage().accessToken;
                    request.headers.set('Authorization', `Bearer ${accessToken}`);
                },
            ],
        },
    });
}

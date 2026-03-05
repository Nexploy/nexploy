import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export function kyGitlab(baseUrl: string) {
    return ky.create({
        prefixUrl: `${baseUrl}/api`,
        hooks: {
            beforeRequest: [
                (request) => {
                    const token = getTokenGitStorage();
                    request.headers.set('Authorization', `Bearer ${token.accessToken}`);
                },
            ],
        },
    });
}

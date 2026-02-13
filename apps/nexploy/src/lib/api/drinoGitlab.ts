import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export const kyGitlab = ky.create({
    prefixUrl: 'https://gitlab.com/api',
    hooks: {
        beforeRequest: [
            (request) => {
                const token = getTokenGitStorage();
                request.headers.set('Authorization', `Bearer ${token.accessToken}`);
            },
        ],
    },
});

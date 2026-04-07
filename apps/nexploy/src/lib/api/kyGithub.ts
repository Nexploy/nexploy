import ky, { Options } from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export interface KyGithubOptions extends Options {
    withAuth?: boolean;
    token?: string;
}

export const kyGithubApi = ky.create({
    prefixUrl: 'https://api.github.com',
    hooks: {
        beforeRequest: [
            (request, options) => {
                const opts = options as KyGithubOptions;
                if (opts.withAuth === false) return;
                const accessToken = opts.token ?? getTokenGitStorage().accessToken;
                request.headers.set('Authorization', `Bearer ${accessToken}`);
            },
        ],
    },
});

export const kyGithubPublic = ky.create({
    prefixUrl: 'https://github.com',
    headers: {
        Accept: 'application/json',
    },
});

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { GitProviderType } from 'generated/client';

const RepositoryGitProviderContext = createContext<GitProviderType>('GITHUB');

export function RepositoryGitProviderProvider({
    gitProvider,
    children,
}: {
    gitProvider: GitProviderType;
    children: ReactNode;
}) {
    return (
        <RepositoryGitProviderContext.Provider value={gitProvider}>{children}</RepositoryGitProviderContext.Provider>
    );
}

export function useRepositoryGitProvider(): GitProviderType {
    return useContext(RepositoryGitProviderContext);
}

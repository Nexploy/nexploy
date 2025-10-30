export type RedirectRule = {
    condition: boolean;
    targetPath: string;
    shouldSkip: (pathname: string) => boolean;
};

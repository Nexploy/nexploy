import * as path from 'node:path';

export function safeResolvePath(base: string, userPath: string): string {
    if (path.isAbsolute(userPath)) {
        throw new Error(`Path must be relative, got: "${userPath}"`);
    }
    const resolvedBase = path.resolve(base);
    const resolved = path.resolve(base, userPath);
    if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
        throw new Error(`Path "${userPath}" escapes the working directory`);
    }
    return resolved;
}

export function safeContainerPath(containerPath: string): string {
    if (containerPath.includes('\0')) {
        throw new Error('Container path must not contain null bytes');
    }
    if (!containerPath.startsWith('/')) {
        throw new Error(`Container working directory must be an absolute path, got: "${containerPath}"`);
    }
    return path.posix.normalize(containerPath);
}

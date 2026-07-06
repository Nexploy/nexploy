import * as path from 'node:path';
export function safeResolvePath(base, userPath) {
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

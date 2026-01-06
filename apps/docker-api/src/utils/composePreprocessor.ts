export function substituteEnvVars(
    content: string,
    envVars: Record<string, string>,
): string {
    return content.replace(
        /\$\{([^}:]+)(:-?([^}]*))?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
        (match, varName1, colonDefault, defaultValue, varName2) => {
            const varName = varName1 || varName2;

            if (varName in envVars) {
                const value = envVars[varName];
                if (colonDefault?.startsWith(':-') && value === '') {
                    return defaultValue ?? '';
                }
                return value;
            }

            if (varName in process.env) {
                const value = process.env[varName];
                if (colonDefault?.startsWith(':-') && value === '') {
                    return defaultValue ?? '';
                }
                return value ?? '';
            }

            if (defaultValue !== undefined) {
                return defaultValue;
            }

            return match;
        },
    );
}

export function findUnresolvedVariables(content: string): string[] {
    const unresolvedPattern = /\$\{([^}:]+)(?::-?[^}]*)?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;
    const matches: string[] = [];
    let match;

    while ((match = unresolvedPattern.exec(content)) !== null) {
        const varName = match[1] || match[2];
        if (!matches.includes(varName)) {
            matches.push(varName);
        }
    }

    return matches;
}

const PATTERN = /\$\{([^}:]+)(?:(:[-?+])([^}]*))?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

export function substituteEnvVars(content: string, envVars: Record<string, string>): string {
    return content.replace(PATTERN, (match, varName1, operator, operand, varName2) => {
        const varName = varName1 || varName2;

        let value: string | undefined;
        if (varName in envVars) {
            value = envVars[varName];
        } else if (varName in process.env) {
            value = process.env[varName];
        }

        const isEmpty = !value || value === '';

        const op = operator ? operator.slice(1) : undefined;

        switch (op) {
            case '-':
                return isEmpty ? (operand ?? '') : value!;

            case '?':
                if (isEmpty) {
                    throw new Error(
                        `Required variable "${varName}" is not set${operand ? `: ${operand}` : ''}`,
                    );
                }
                return value!;

            case '+':
                return isEmpty ? '' : (operand ?? '');

            default:
                return value ?? match;
        }
    });
}

export function findUnresolvedVariables(content: string): string[] {
    const unresolvedPattern = /\$\{([^}:]+)(?::[-?+][^}]*)?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;
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

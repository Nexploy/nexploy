// Matches ${VAR}, ${VAR:-default}, ${VAR:?error}, ${VAR:+value}, and $VAR
const PATTERN = /\$\{([^}:]+)(?:(:[-?+])([^}]*))?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

export function substituteEnvVars(
    content: string,
    envVars: Record<string, string>,
): string {
    return content.replace(
        PATTERN,
        (match, varName1, operator, operand, varName2) => {
            const varName = varName1 || varName2;

            let value: string | undefined;
            if (varName in envVars) {
                value = envVars[varName];
            } else if (varName in process.env) {
                value = process.env[varName];
            }

            const isEmpty = value === undefined || value === '';

            // Operator is the char after ':', e.g. '-', '?', '+'
            const op = operator ? operator.slice(1) : undefined;

            switch (op) {
                case '-': // ${VAR:-default} — use default if unset or empty
                    return isEmpty ? (operand ?? '') : value!;

                case '?': // ${VAR:?error} — fail if unset or empty
                    if (isEmpty) {
                        throw new Error(
                            `Required variable "${varName}" is not set${operand ? `: ${operand}` : ''}`,
                        );
                    }
                    return value!;

                case '+': // ${VAR:+replacement} — use replacement if set and non-empty
                    return isEmpty ? '' : (operand ?? '');

                default:
                    // Simple ${VAR} or $VAR — return value or leave unchanged
                    return value ?? match;
            }
        },
    );
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

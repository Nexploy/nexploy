import * as yaml from 'yaml';

export function validateYaml(content: string): string | null {
    if (!content.trim()) return null;
    try {
        yaml.parse(content);
        return null;
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid YAML';
        return msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
    }
}

export function formatYaml(content: string): string {
    return yaml.stringify(yaml.parse(content), { indent: 2, lineWidth: 0 });
}

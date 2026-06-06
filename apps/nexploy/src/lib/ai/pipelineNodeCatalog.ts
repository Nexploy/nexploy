import { z } from 'zod';
import { NODE_META_MAP, type NodeMeta } from '@/lib/ai/pipelineNodeMeta';

export interface ConfigField {
    key: string;
    type: string;
    required: boolean;
    default?: unknown;
    enumValues?: string[];
    refable?: boolean;
}

export interface NodeCatalogEntry {
    type: string;
    category: string;
    description: string;
    isStartNode?: boolean;
    isEndNode?: boolean;
    outputs: string[];
    consumesFromUpstream?: string[];
    configFields: ConfigField[];
}

type JsonSchemaProp = {
    type?: string;
    enum?: string[];
    default?: unknown;
    anyOf?: JsonSchemaProp[];
    items?: JsonSchemaProp;
};

function resolveFieldType(prop: JsonSchemaProp): {
    type: string;
    enumValues?: string[];
    refable?: boolean;
} {
    if (prop.anyOf) {
        const first = prop.anyOf[0];
        if (first) {
            const inner = resolveFieldType(first);
            return { ...inner, refable: true };
        }
    }
    if (prop.enum) return { type: 'enum', enumValues: prop.enum };
    if (prop.type === 'array') return { type: 'array' };
    if (prop.type === 'object') return { type: 'object' };
    if (prop.type === 'number' || prop.type === 'integer') return { type: 'number' };
    if (prop.type === 'boolean') return { type: 'boolean' };
    return { type: 'string' };
}

function buildConfigFields(meta: NodeMeta): ConfigField[] {
    if (!meta.schema) return [];

    const jsonSchema = z.toJSONSchema(meta.schema) as {
        properties?: Record<string, JsonSchemaProp>;
        required?: string[];
    };

    const props = jsonSchema.properties ?? {};
    const required = new Set(jsonSchema.required ?? []);

    return Object.entries(props).map(([key, prop]) => {
        const { type, enumValues, refable } = resolveFieldType(prop);
        return {
            key,
            type,
            required: required.has(key),
            ...(prop.default !== undefined && { default: prop.default }),
            ...(enumValues && { enumValues }),
            ...(refable && { refable }),
        };
    });
}

function buildEntry(type: string, meta: NodeMeta): NodeCatalogEntry {
    return {
        type,
        category: meta.category,
        description: meta.description,
        ...(meta.isStartNode && { isStartNode: true }),
        ...(meta.isEndNode && { isEndNode: true }),
        outputs: meta.outputs,
        ...(meta.consumesFromUpstream && { consumesFromUpstream: meta.consumesFromUpstream }),
        configFields: buildConfigFields(meta),
    };
}

export const PIPELINE_NODE_CATALOG: NodeCatalogEntry[] = Object.entries(NODE_META_MAP).map(
    ([type, meta]) => buildEntry(type, meta),
);

export function getNodesByCategory(): Record<string, NodeCatalogEntry[]> {
    return PIPELINE_NODE_CATALOG.reduce<Record<string, NodeCatalogEntry[]>>((acc, node) => {
        (acc[node.category] ??= []).push(node);
        return acc;
    }, {});
}

export function getCompactCatalog(): string {
    const grouped = getNodesByCategory();
    const lines: string[] = [];

    for (const [category, nodes] of Object.entries(grouped)) {
        lines.push(`\n## ${category.toUpperCase()}`);
        for (const node of nodes) {
            const fields = node.configFields
                .map((f) => {
                    let label = f.key;
                    if (f.enumValues) label += `(${f.enumValues.join('|')})`;
                    if (!f.required) label += '?';
                    if (f.refable) label += ' [refable]';
                    return label;
                })
                .join(', ');

            const outputs = node.outputs.length ? ` → [${node.outputs.join(', ')}]` : '';
            const consumes = node.consumesFromUpstream?.length
                ? ` ← needs [${node.consumesFromUpstream.join(', ')}]`
                : '';

            lines.push(`- **${node.type}**: ${node.description}${consumes}${outputs}`);
            if (fields) lines.push(`  config: { ${fields} }`);
        }
    }

    return lines.join('\n');
}

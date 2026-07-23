export const ORG_SCOPED_RESOURCES = [
    'repository',
    'build',
    'deployment',
    'pipeline',
    'envVar',
    'stage',
    'domain',
    'ssl',
    'container',
] as const;

export type OrgScopedResource = (typeof ORG_SCOPED_RESOURCES)[number];

export function isOrgScopedResource(resource: string): resource is OrgScopedResource {
    return (ORG_SCOPED_RESOURCES as readonly string[]).includes(resource);
}

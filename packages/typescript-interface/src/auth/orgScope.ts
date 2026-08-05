export type OrgScopeArgs<
    Resource extends string,
    ScopedResource extends string,
    Resolver,
> = Resource extends ScopedResource ? [orgResolver: Resolver] : [orgResolver?: never];

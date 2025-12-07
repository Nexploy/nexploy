interface GitLabNamespace {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
    parent_id: number | null;
    avatar_url: string | null;
    web_url: string;
}

interface GitLabOwner {
    id: number;
    name: string;
    created_at: string;
}

export interface GitlabRepo {
    id: number;
    description: string | null;
    description_html: string | null;
    name: string;
    name_with_namespace: string;
    path: string;
    path_with_namespace: string;
    created_at: string;
    updated_at: string;
    default_branch: string;
    tag_list: string[];
    topics: string[];
    ssh_url_to_repo: string;
    http_url_to_repo: string;
    web_url: string;
    readme_url: string | null;
    avatar_url: string | null;
    forks_count: number;
    star_count: number;
    last_activity_at: string;
    namespace: GitLabNamespace;
    owner?: GitLabOwner;
    visibility: 'private' | 'internal' | 'public';
    archived: boolean;
    empty_repo: boolean;

    issues_enabled: boolean;
    merge_requests_enabled: boolean;
    wiki_enabled: boolean;
    jobs_enabled: boolean;
    snippets_enabled: boolean;
    container_registry_enabled: boolean;

    issues_access_level: string;
    repository_access_level: string;
    merge_requests_access_level: string;
    forking_access_level: string;
    wiki_access_level: string;
    builds_access_level: string;
    snippets_access_level: string;
    pages_access_level: string;
    analytics_access_level: string;
    container_registry_access_level: string;
    security_and_compliance_access_level: string;

    statistics?: {
        commit_count: number;
        storage_size: number;
        repository_size: number;
        wiki_size: number;
        lfs_objects_size: number;
        job_artifacts_size: number;
        pipeline_artifacts_size: number;
        packages_size: number;
        snippets_size: number;
        uploads_size: number;
        container_registry_size: number;
    };

    permissions?: {
        project_access: {
            access_level: number;
            notification_level: number;
        } | null;
        group_access: {
            access_level: number;
            notification_level: number;
        } | null;
    };

    shared_runners_enabled: boolean;
    group_runners_enabled: boolean;
    public_jobs: boolean;
    ci_config_path: string;
    ci_default_git_depth: number;
    ci_forward_deployment_enabled: boolean;
    ci_forward_deployment_rollback_allowed: boolean;

    merge_method: 'merge' | 'rebase_merge' | 'ff';
    only_allow_merge_if_pipeline_succeeds: boolean;
    allow_merge_on_skipped_pipeline: boolean;
    only_allow_merge_if_all_discussions_are_resolved: boolean;
    remove_source_branch_after_merge: boolean;
    request_access_enabled: boolean;
    squash_option: 'never' | 'always' | 'default_on' | 'default_off';

    _links: {
        self: string;
        issues: string;
        merge_requests: string;
        repo_branches: string;
        labels: string;
        events: string;
        members: string;
        cluster_agents: string;
    };

    import_url: string | null;
    import_type: string | null;
    import_status: string;
    open_issues_count: number;
    creator_id: number;
    container_registry_image_prefix: string;
    autoclose_referenced_issues: boolean;
}

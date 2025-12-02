import { ProjectBuild } from '@/components/projects/tabs/builds/ProjectBuild';
import { getAllBuildsInngest } from '@/services/inngest/build.inngest.service';

interface ProjectOverviewTabProps {
    projectId: string;
}

export async function ProjectBuildsTab({ projectId }: ProjectOverviewTabProps) {
    const builds = await getAllBuildsInngest(projectId);

    return (
        <div className="flex flex-col gap-4 px-5">
            <h2 className="text-xl font-semibold">Recent Builds</h2>
            <div className="rounded-md border">
                {builds.length === 0 ? (
                    <div className="text-muted-foreground p-8 text-center text-sm">
                        No builds yet.
                    </div>
                ) : (
                    <div className="divide-y">
                        {builds.map((build) => (
                            <ProjectBuild key={build.id} projectId={projectId} build={build} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { GitProviderCard } from '@/components/git/GitProviderCard';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { listAccount } from '@/services/auth/auth.service';
import { GitBranch, Github, Gitlab } from 'lucide-react';

export default async function GitPage() {
    const accounts = await listAccount();

    const getAccount = (provider: string) =>
        accounts.find((a) => a.providerId === provider) ?? null;

    const providers = [
        {
            provider: 'github',
            name: 'GitHub',
            description:
                'Connectez votre compte GitHub pour importer vos dépôts et configurer des déploiements automatiques.',
            icon: <Github className="size-5" />,
        },
        {
            provider: 'gitlab',
            name: 'GitLab',
            description:
                'Connectez votre compte GitLab pour accéder à vos projets et pipelines CI/CD.',
            icon: <Gitlab className="size-5" />,
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <GitBranch className="text-primary size-7" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Git Integrations
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Gérez vos connexions aux fournisseurs de versioning
                        </p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="space-y-6 pb-6">
                        {providers.map((p) => {
                            const account = getAccount(p.provider);

                            return (
                                <GitProviderCard
                                    key={p.provider}
                                    provider={p.provider}
                                    name={p.name}
                                    description={p.description}
                                    icon={p.icon}
                                    isConnected={!!account}
                                />
                            );
                        })}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

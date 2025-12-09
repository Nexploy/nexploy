import { IntegrationCard } from '@/components/git/IntegrationCard';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { listAccount } from '@/services/auth/auth.service';
import { Cloud, GitBranch, Github, Gitlab, Plug } from 'lucide-react';

export default async function IntegrationsPage() {
    const accounts = await listAccount();

    const getAccount = (provider: string) =>
        accounts.find((a) => a.providerId === provider) ?? null;

    const gitProviders = [
        {
            provider: 'github',
            name: 'GitHub',
            description: 'Importez vos dépôts et déployez automatiquement.',
            icon: <Github className="size-5" />,
        },
        {
            provider: 'gitlab',
            name: 'GitLab',
            description: 'Accédez à vos projets et pipelines CI/CD.',
            icon: <Gitlab className="size-5" />,
        },
    ];

    const cloudProviders = [
        {
            provider: 'cloudflare',
            name: 'Cloudflare',
            description: 'Gérez vos DNS et tunnels.',
            icon: <Cloud className="size-5" />,
            comingSoon: true,
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Plug className="text-primary size-7" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Intégrations
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Connectez vos services externes
                        </p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="space-y-6 pb-6">
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <GitBranch className="text-muted-foreground size-4" />
                                <h2 className="text-sm font-medium">Providers Git</h2>
                            </div>
                            <div className="space-y-2">
                                {gitProviders.map((p) => (
                                    <IntegrationCard
                                        key={p.provider}
                                        provider={p.provider}
                                        name={p.name}
                                        description={p.description}
                                        icon={p.icon}
                                        isConnected={!!getAccount(p.provider)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Cloud className="text-muted-foreground size-4" />
                                <h2 className="text-sm font-medium">Cloud & Infrastructure</h2>
                            </div>
                            <div className="space-y-2">
                                {cloudProviders.map((p) => (
                                    <div key={p.provider} className="relative">
                                        {p.comingSoon && (
                                            <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                                                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
                                                    Bientôt disponible
                                                </span>
                                            </div>
                                        )}
                                        <IntegrationCard
                                            provider={p.provider}
                                            name={p.name}
                                            description={p.description}
                                            icon={p.icon}
                                            isConnected={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}

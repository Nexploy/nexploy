import { Container } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@workspace/ui/components/card';
import type { DockerEngineVersion } from '@workspace/typescript-interface/docker/docker.system';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { kyDocker } from '@/lib/api/kyDocker';

async function getDockerEngineVersion(): Promise<DockerEngineVersion | null> {
    try {
        return await kyDocker.get('system/docker-version', { timeout: 10_000 }).json<DockerEngineVersion>();
    } catch {
        return null;
    }
}

export async function DockerEngineCard() {
    const [t, engine] = await Promise.all([getTranslations('admin.settings'), getDockerEngineVersion()]);

    const rows = engine
        ? [
              { label: t('dockerEngineVersion'), value: engine.version },
              { label: t('dockerEngineApiVersion'), value: engine.apiVersion },
              {
                  label: t('dockerEnginePlatform'),
                  value: engine.os && engine.arch ? `${engine.os}/${engine.arch}` : null,
              },
              { label: t('dockerEngineKernel'), value: engine.kernelVersion },
          ].filter((row) => Boolean(row.value))
        : [];

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Container}
                title={t('dockerEngineTitle')}
                description={t('dockerEngineDescription')}
            />
            <CardContent>
                {engine ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {rows.map((row) => (
                            <div key={row.label} className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">{row.label}</span>
                                    <span className="break-all font-medium">{row.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">{t('dockerEngineUnavailable')}</p>
                )}
            </CardContent>
        </Card>
    );
}

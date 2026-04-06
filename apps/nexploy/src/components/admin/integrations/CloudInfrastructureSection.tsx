import { getUserSession } from '@/services/auth/auth.service';
import { getCloudflareCredentialInfo } from '@/services/cloudflare.service';
import { getAllAwsAccounts } from '@/services/aws.service';
import { Cloud } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '@workspace/ui/components/accordion';
import { CloudflareIntegrationCard } from '@/components/admin/integrations/CloudflareIntegrationCard';
import { AwsAddButton } from '@/components/admin/integrations/AwsAddButton';
import { AwsInstanceCard } from '@/components/admin/integrations/AwsInstanceCard';
import { cn } from '@workspace/ui/lib/utils';

export async function CloudInfrastructureSection() {
    const [session, t, awsAccounts] = await Promise.all([
        getUserSession(),
        getTranslations('integrations'),
        getAllAwsAccounts(),
    ]);

    const cloudflareInfo = session
        ? await getCloudflareCredentialInfo(session.user.id)
        : { isConnected: false };

    const hasAwsAccounts = awsAccounts.length > 0;

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <Cloud className="text-muted-foreground size-4" />
                <h2 className="text-sm font-medium">{t('cloudInfrastructure')}</h2>
            </div>
            <div className="space-y-2">
                <CloudflareIntegrationCard isConnected={cloudflareInfo.isConnected} />
            </div>
            <Accordion type="multiple" className="flex flex-col gap-3" defaultValue={['aws']}>
                <AccordionItem value="aws" className="bg-card rounded-lg border !border-b">
                    <AccordionTrigger
                        position="left"
                        showChevron={hasAwsAccounts}
                        classNameChevron="size-5"
                        className={cn(
                            'px-4 hover:no-underline',
                            hasAwsAccounts && 'cursor-pointer',
                        )}
                        headerChildren={
                            <div className="pr-4">
                                <AwsAddButton />
                            </div>
                        }
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                                <Cloud className="size-5" />
                            </div>
                            <div className="flex min-w-0 flex-col text-left">
                                <span>{t('aws.title')}</span>
                                <span className="text-muted-foreground text-xs font-normal">
                                    ({t('aws.instanceCount', { count: awsAccounts.length })})
                                </span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    {hasAwsAccounts && (
                        <AccordionContent className="bg-muted/40 border-t p-5">
                            <div className="space-y-2">
                                {awsAccounts.map((account) => (
                                    <AwsInstanceCard
                                        key={account.id}
                                        id={account.id}
                                        displayName={account.displayName}
                                        region={account.region}
                                        maskedAccessKeyId={account.maskedAccessKeyId}
                                    />
                                ))}
                            </div>
                        </AccordionContent>
                    )}
                </AccordionItem>
            </Accordion>
        </section>
    );
}

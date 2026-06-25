'use client';

import { STATUS, type Step, useJoyride } from 'react-joyride';
import { useTranslations } from 'next-intl';
import { useLocalStorage } from 'usehooks-ts';
import { useRouter } from '@/i18n/navigation';
import { OnboardingTooltip } from '@/components/onboarding/OnboardingTooltip';
import { OnboardingBeacon } from '@/components/onboarding/OnboardingBeacon';
import { ONBOARDING_STORAGE_KEY } from '@/components/onboarding/storage';
import type { OnboardingStatus } from '@workspace/typescript-interface/onboarding/onboarding';

function waitForElement(selector: string, timeout = 8000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
            const element = document.querySelector<HTMLElement>(selector);
            if (element) {
                resolve(element);
                return;
            }
            if (Date.now() - start > timeout) {
                resolve(null);
                return;
            }
            requestAnimationFrame(check);
        };
        check();
    });
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function revealElement(selector: string): Promise<void> {
    const element = await waitForElement(selector);
    element?.scrollIntoView({ block: 'center', behavior: 'auto' });
    await delay(300);
}

export function OnboardingTour() {
    const t = useTranslations('common');
    const router = useRouter();
    const [status, setStatus] = useLocalStorage<OnboardingStatus>(ONBOARDING_STORAGE_KEY, null);

    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            title: t('onboarding.welcome.title'),
            content: t('onboarding.welcome.content'),
        },
        {
            target: '[data-tour="docker"]',
            placement: 'right',
            title: t('onboarding.docker.title'),
            content: t('onboarding.docker.content'),
            before: () => revealElement('[data-tour="docker"]'),
        },
        {
            target: '[data-tour="git-providers"]',
            placement: 'auto',
            title: t('onboarding.integrations.title'),
            content: t('onboarding.integrations.content'),
            before: async () => {
                router.push('/admin/integrations');
                await revealElement('[data-tour="git-providers"]');
            },
        },
        {
            target: '[data-tour="account-integrations"]',
            placement: 'auto',
            title: t('onboarding.account.title'),
            content: t('onboarding.account.content'),
            before: async () => {
                router.push('/account');
                await revealElement('[data-tour="account-integrations"]');
            },
        },
        {
            target: '[data-tour="add-repository"]',
            placement: 'bottom',
            title: t('onboarding.repositories.title'),
            content: t('onboarding.repositories.content'),
            before: async () => {
                router.push('/repositories');
                await revealElement('[data-tour="add-repository"]');
            },
        },
    ];

    const { Tour } = useJoyride({
        continuous: true,
        run: status === 'pending',
        steps,
        tooltipComponent: OnboardingTooltip,
        beaconComponent: OnboardingBeacon,
        locale: {
            back: t('onboarding.controls.back'),
            close: t('onboarding.controls.close'),
            last: t('onboarding.controls.last'),
            next: t('onboarding.controls.next'),
            skip: t('onboarding.controls.skip'),
        },
        options: {
            primaryColor: 'var(--primary)',
            arrowColor: 'var(--popover)',
            overlayColor: 'rgba(0, 0, 0, 0.55)',
            zIndex: 10000,
            spotlightRadius: 8,
            skipScroll: true,
        },
        onEvent: (data) => {
            if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
                setStatus('done');
            }
        },
    });

    return <>{Tour}</>;
}

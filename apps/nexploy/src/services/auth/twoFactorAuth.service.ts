import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import {
    TypeTwoFactorAuthCodeSchema,
    TypeTwoFactorAuthSchema,
} from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { TOTP } from '@workspace/typescript-interface/auth/twoFactorAuth';
import { headers } from 'next/headers';

export async function enable2FA({ password }: TypeTwoFactorAuthSchema): Promise<TOTP> {
    const t = await getTranslations('auth');

    const resEnable2FA = await auth.api.enableTwoFactor({
        body: {
            password,
        },
        headers: await headers(),
        asResponse: true,
    });

    const parseRes = await resEnable2FA.json();
    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes;
}

export async function disable2FA({ password }: TypeTwoFactorAuthSchema) {
    const t = await getTranslations('auth');

    const resEnable2FA = await auth.api.disableTwoFactor({
        body: {
            password,
        },
        headers: await headers(),
        asResponse: true,
    });

    const parseRes = await resEnable2FA.json();

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes;
}

export async function verifCode({ code, trustDevice }: TypeTwoFactorAuthCodeSchema) {
    const t = await getTranslations('auth');

    const resVerifTotp = await auth.api.verifyTOTP({
        body: {
            code,
            trustDevice,
        },
        headers: await headers(),
        asResponse: true,
    });

    const parseRes = await resVerifTotp.json();

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes;
}

export async function useBackupCode({ code, trustDevice }: TypeTwoFactorAuthCodeSchema) {
    const t = await getTranslations('auth');

    const formattedCode = code.slice(0, 5) + '-' + code.slice(5);

    const resVerifyBackupCode = await auth.api.verifyBackupCode({
        body: {
            code: formattedCode,
            trustDevice,
        },
        headers: await headers(),
        asResponse: true,
    });

    const parseRes = await resVerifyBackupCode.json();

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes;
}

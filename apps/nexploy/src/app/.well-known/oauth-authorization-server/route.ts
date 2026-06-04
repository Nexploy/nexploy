import { oAuthDiscoveryMetadata } from 'better-auth/plugins';
import { auth } from '@/lib/auth/auth';

export const GET = oAuthDiscoveryMetadata(auth);

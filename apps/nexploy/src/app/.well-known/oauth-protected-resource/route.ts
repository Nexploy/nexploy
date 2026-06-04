import { oAuthProtectedResourceMetadata } from 'better-auth/plugins';
import { auth } from '@/lib/auth/auth';

export const GET = oAuthProtectedResourceMetadata(auth);

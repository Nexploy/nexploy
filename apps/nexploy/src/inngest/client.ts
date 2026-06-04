import { Inngest } from 'inngest';

export const inngest = new Inngest({
    id: 'nextploy',
    isDev: process.env.NODE_ENV !== 'production',
});

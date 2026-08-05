import { Inngest } from 'inngest';

export const inngest = new Inngest({
    id: 'nexploy',
    isDev: process.env.NODE_ENV !== 'production',
});

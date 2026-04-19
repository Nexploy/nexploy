import { secureHeaders } from 'hono/secure-headers';

export const securityHeadersMiddleware = secureHeaders({
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'no-referrer',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xXssProtection: '0',
    permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
    },
});

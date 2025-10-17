import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'
import { serve } from '@hono/node-server';
import swaggerJSDoc from 'swagger-jsdoc';

const app = new Hono()

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'Nexploy APIs',
            version: '1.0.0',
        },
        servers: [
            { url: 'http://localhost:3300', description: 'Local Docker API' },
        ]
    },
    apis: [
        '../../apps/*/src/**/*.ts'
    ],
})

app.get('/doc', (c) => c.json(swaggerSpec))

app.get('/scalar', Scalar({ url: '/doc', theme: 'purple', pageTitle: 'Nexploy API' }))


serve({ fetch: app.fetch, port: 3330 }, (info) =>
    console.log(`Server running on http://localhost:${info.port}`)
)

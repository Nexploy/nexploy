import { Hono } from 'hono';
import swarmRoutes from './swarmRoutes';
import nodeRoutes from './nodeRoutes';

const app = new Hono();

app.route('/nodes', nodeRoutes);

app.route('/', swarmRoutes);

export default app;

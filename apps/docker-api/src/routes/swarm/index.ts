import { Hono } from 'hono';
import swarmRoutes from './swarmRoutes';
import nodeRoutes from './nodeRoutes';
import serviceRoutes from './serviceRoutes';

const app = new Hono();

app.route('/nodes', nodeRoutes);
app.route('/services', serviceRoutes);
app.route('/', swarmRoutes);

export default app;

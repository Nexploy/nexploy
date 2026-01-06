import { Hono } from 'hono';
import swarmRoutes from './swarmRoutes';
import nodeRoutes from './nodeRoutes';
import serviceRoutes from './serviceRoutes';
import taskRoutes from './taskRoutes';

const app = new Hono();

app.route('/nodes', nodeRoutes);
app.route('/services', serviceRoutes);
app.route('/tasks', taskRoutes);

app.route('/', swarmRoutes);

export default app;

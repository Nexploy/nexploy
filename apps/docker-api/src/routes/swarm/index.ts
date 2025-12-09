import { Hono } from 'hono';
import swarmRoutes from './swarmRoutes';
import nodeRoutes from './nodeRoutes';
import serviceRoutes from './serviceRoutes';
import taskRoutes from './taskRoutes';

const app = new Hono();

// Mount sub-routes
app.route('/nodes', nodeRoutes);
app.route('/services', serviceRoutes);
app.route('/tasks', taskRoutes);

// Mount cluster operations at root
app.route('/', swarmRoutes);

export default app;

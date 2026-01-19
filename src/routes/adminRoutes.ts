import { FastifyInstance } from 'fastify';
import { adminService } from '../services/adminService';

export async function adminRoutes(app: FastifyInstance) {
    app.post('/tenants', async (request, reply) => {
        try {
            const data = request.body as any; // Validação simples por enquanto
            if (!data.name || !data.slug || !data.owner_email) {
                return reply.status(400).send({ error: 'Missing fields: name, slug, owner_email' });
            }
            const tenant = await adminService.createTenant(data);
            return reply.status(201).send(tenant);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    app.get('/tenants', async (request, reply) => {
        try {
            const tenants = await adminService.listTenants();
            return tenants;
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });
}

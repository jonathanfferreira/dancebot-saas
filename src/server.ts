import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const server = fastify({ logger: true });

server.register(cors, {
    origin: '*', // Ajustar para produção depois
});

// Routes
import { adminRoutes } from './routes/adminRoutes';
server.register(adminRoutes, { prefix: '/admin' });

// Health Check
server.get('/ping', async (request, reply) => {
    return { status: 'ok', message: 'DanceBot SaaS Engine Running 🚀' };
});

// Webhook para Evolution API (Centralizado)
import { botEngine } from './services/botEngine';
server.post('/webhook/evolution', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as any;
    try {
        await botEngine.processWebhook(data);
        return { received: true };
    } catch (error) {
        console.error('Webhook processing error:', error);
        return { received: false, error: 'Internal Error' };
    }
});

const start = async () => {
    try {
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();

// Configuration
import './configuration/aliases';
import { environment } from './configuration/environment';
import { initializeDatabaseConnection } from './configuration/database';

// Librairies
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';

// Controllers
import { controllers } from './controllers';

const fastify = Fastify({
    logger: true,
});

const initializeServer = async () => {

    const { port, allowedOrigin } = environment;

    // Database Connection
    const orm = await initializeDatabaseConnection(environment);

    // Fastify configuration
    fastify.register(fastifyCors, {
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    });

    fastify.register(fastifyCookie);

    // Controllers
    fastify.register((fastify, options) => controllers.user(fastify, options, orm));

    // Server listening
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log(`\x1b[33m⚡️ Server is running at http://localhost:${port}\x1b[0m`);
};

initializeServer();
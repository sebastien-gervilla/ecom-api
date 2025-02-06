import { environment } from '@/configuration/environment';
import { Interfaces } from '@/interfaces';
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export const authentication = (request: FastifyRequest, reply: FastifyReply, done: Function) => {
    const token = request.cookies.token;

    if (!token)
        return reply.status(401).send({ message: 'Not authenticated' });

    try {

        const decoded = jwt.verify(token, environment.jwtSecret) as Interfaces.Users.JWTPayload;

        // @ts-ignore
        request.user = decoded;

        done();
    } catch (error) {
        return reply.status(401).send({ message: 'Not authenticated' });
    }
};
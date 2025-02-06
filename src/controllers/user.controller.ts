import { entities } from "@/entities";
import { Interfaces } from "@/interfaces";
import { MikroORM } from "@mikro-orm/postgresql";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { environment } from "@/configuration/environment";
import { middlewares } from "@/middlewares";

export const userController = async (
    fastify: FastifyInstance, 
    _: FastifyPluginOptions,
    orm: MikroORM
) => {
    fastify.post('/users/register', async (request, reply) => {

        const {
            firstName,
            lastName,
            email,
            password
        } = request.body as Interfaces.Users.Register['body'];

        const em = orm.em.fork();

        if (!firstName || !lastName || !email || !password)
            return reply.status(400).send('Missing required fields');

        const existingUser = await em.findOne(
            entities.user, {
                email
            },
        );

        if (existingUser)
            return reply.status(400).send('Email is already in use');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new entities.user();
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.password = hashedPassword;
        user.role = Interfaces.Users.Role.CLIENT;
        await em.persistAndFlush(user);

        return reply.status(201).send({ message: 'User successfully registered.' });
    });
    
    fastify.post('/users/login', async (request, reply) => {

        const {
            email,
            password
        } = request.body as Interfaces.Users.Login['body'];

        const em = orm.em.fork();

        if (!email || !password)
            return reply.status(400).send('Missing required fields');

        const user = await em.findOne(
            entities.user, {
                email
            },
        );

        if (!user)
            return reply.status(400).send('Invalid credentials');

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch)
            return reply.status(400).send('Invalid credentials');

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            environment.jwtSecret,
            { expiresIn: '1h' }
        );

        return reply
            .setCookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 3600,
            })
            .status(204)
            .send({ message: 'User successfully logged in.' });
    });

    fastify.post('/users/logout', { preHandler: middlewares.authentication }, async (_, reply) => {
        reply.clearCookie('token', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        return reply.status(204).send();
    });
}
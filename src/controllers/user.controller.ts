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
    fastify.get('/users', { preHandler: middlewares.authentication }, async (request, reply) => {

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser || currentUser.role !== Interfaces.Users.Role.ADMINISTRATOR)
            return reply.status(403).send("Not allowed");

        const {
            page = 1,
            pageSize = 50,
        } = request.query as Interfaces.Users.GetRequest['query'];

        if (page < 0 || pageSize < 0)
            return reply.status(400).send("Page and pageSize must be positive");

        const em = orm.em.fork();

        const loadedUsers = await em.findAll(
            entities.user,
        );

        const totalRecords = loadedUsers.length;
        const pages = Math.floor(totalRecords / pageSize) + 1;

        const users: Interfaces.Users.Get['body'] = loadedUsers
            .slice((page - 1) * pageSize, page * pageSize)
            .map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            }));

        return reply
            .status(200)
            .send({
                data: users,
                meta: {
                    pagination: {
                        page,
                        pages,
                        pageSize,
                        totalRecords,
                    }
                }
            });
    });

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

        const user = await em.findOne(entities.user, {
            email
        });

        if (!user)
            return reply.status(400).send('Invalid credentials');

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch)
            return reply.status(400).send('Invalid credentials');

        const tokenPayload: Interfaces.Users.JWTPayload = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };

        const token = jwt.sign(
            tokenPayload,
            environment.jwtSecret,
            { expiresIn: '1h' }
        );

        return reply
            .setCookie('token', token, {
                httpOnly: true,
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
        });
        return reply.status(204).send();
    });

    fastify.get('/users/current', { preHandler: middlewares.authentication }, async (request, reply) => {

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;

        return reply
            .status(200)
            .send({ data: currentUser });
    });
}
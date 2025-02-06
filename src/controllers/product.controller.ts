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
    fastify.post('/products', { preHandler: middlewares.authentication }, async (request, reply) => {

        const {
            name,
            description,
            price,
            stock,
            url
        } = request.body as Interfaces.Products.Create['body'];

        const em = orm.em.fork();

        if (!name || !description || !url)
            return reply.status(400).send('Missing required fields');

        if (stock < 0)
            return reply.status(400).send("Stock can't be negative");

        if (price < 0)
            return reply.status(400).send("Price can't be negative");

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser || currentUser.role !== Interfaces.Users.Role.ADMINISTRATOR)
            return reply.status(403).send("Not allowed");

        const existingProduct = await em.findOne(
            entities.product, {
                name
            },
        );

        if (existingProduct)
            return reply.status(400).send('Product already exists');

        const product = new entities.product();
        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        await em.persistAndFlush(product);

        return reply.status(201).send({ message: 'Product successfully created.' });
    });
}
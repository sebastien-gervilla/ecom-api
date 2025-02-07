import { entities } from "@/entities";
import { Interfaces } from "@/interfaces";
import { MikroORM } from "@mikro-orm/postgresql";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { middlewares } from "@/middlewares";

export const productController = async (
    fastify: FastifyInstance,
    _: FastifyPluginOptions,
    orm: MikroORM
) => {

    fastify.get('/products/search', { preHandler: middlewares.authentication }, async (request, reply) => {
        const { value } = request.query as { value?: string };

        if (!value || value.trim().length === 0)
            return reply.status(400).send("Search query cannot be empty.");

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser)
            return reply.status(401).send("Not auth");

        const em = orm.em.fork();

        try {
            const products = await em.find(entities.product, {
                name: { $ilike: `%${value}%` } // Case-insensitive search
            });

            return reply.send({ data: products });
        } catch (error) {
            console.error(error);
            return reply.status(500).send("Error searching products");
        }
    });

    fastify.get('/products', { preHandler: middlewares.authentication }, async (request, reply) => {

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser)
            return reply.status(401).send("Not auth");

        const {
            page = 1,
            pageSize = 50,
        } = request.query as Interfaces.Users.GetRequest['query'];

        if (page < 0 || pageSize < 0)
            return reply.status(400).send("Page and pageSize must be positive");

        const em = orm.em.fork();

        const loadedProducts = await em.findAll(
            entities.product,
        );

        const totalRecords = loadedProducts.length;
        const pages = Math.floor(totalRecords / pageSize) + 1;

        const products: Interfaces.Products.Get['body'] = loadedProducts
            .slice((page - 1) * pageSize, page * pageSize)
            .map(product => ({
                id: product.id,
                reference: product.reference,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                url: product.url,
            }));

        return reply
            .status(200)
            .send({
                data: products,
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

    fastify.post('/products', { preHandler: middlewares.authentication }, async (request, reply) => {

        const {
            name,
            reference,
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

        const existingProduct = await em.findOne(entities.product, {
            name
        });

        if (existingProduct)
            return reply.status(400).send('Product already exists');

        const product = new entities.product();
        product.name = name;
        product.reference = reference;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.url = url;
        await em.persistAndFlush(product);

        return reply.status(201).send({ message: 'Product successfully created.' });
    });

    fastify.put('/products/:id', { preHandler: middlewares.authentication }, async (request, reply) => {

        const { id } = request.params as { id: number };

        const {
            name,
            reference,
            description,
            price,
            stock,
            url
        } = request.body as Interfaces.Products.Update['body'];

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

        const product = await em.findOne(entities.product, {
            id
        });

        if (!product)
            return reply.status(404).send('Product not found');

        product.name = name;
        product.reference = reference;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.url = url;
        await em.persistAndFlush(product);

        return reply.status(204).send({ message: 'Product successfully updated.' });
    });

    fastify.delete('/products/:id', { preHandler: middlewares.authentication }, async (request, reply) => {

        const { id } = request.params as { id: number };

        const em = orm.em.fork();

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser || currentUser.role !== Interfaces.Users.Role.ADMINISTRATOR)
            return reply.status(403).send("Not allowed");

        const product = await em.findOne(entities.product, {
            id
        });

        if (!product)
            return reply.status(404).send('Product not found');

        await em.removeAndFlush(product);

        return reply.status(204).send({ message: 'Product successfully deleted.' });
    });
}
import { entities } from "@/entities";
import { Interfaces } from "@/interfaces";
import { MikroORM } from "@mikro-orm/postgresql";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { middlewares } from "@/middlewares";

export const orderController = async (
    fastify: FastifyInstance,
    _: FastifyPluginOptions,
    orm: MikroORM
) => {
    fastify.get('/orders/current-user', { preHandler: middlewares.authentication }, async (request, reply) => {

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

        const loadedOrders = await em.findAll(entities.order, {
            populate: ['products', 'products.product'],
            where: {
                user: {
                    id: currentUser.id,
                },
            },
        });

        const totalRecords = loadedOrders.length;
        const pages = Math.floor(totalRecords / pageSize) + 1;

        const paginatedOrders = loadedOrders.slice((page - 1) * pageSize, page * pageSize);

        let orders: Interfaces.Orders.Get['body'] = [];
        for (const order of paginatedOrders) {
            const orderProducts: Interfaces.Orders.Get['body'][number]['products'] = [];
            let total = 0;
            for (const { product, quantity } of order.products) {
                total += quantity * product.price;
                orderProducts.push({
                    id: product.id,
                    name: product.name,
                    reference: product.reference,
                    description: product.description,
                    price: product.price,
                    url: product.url,
                    stock: product.stock,
                    quantity,
                });
            }
            orders.push({
                id: order.id,
                products: orderProducts,
                status: order.status,
                total,
            });
        }

        return reply
            .status(200)
            .send({
                data: orders,
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

    fastify.get('/orders', { preHandler: middlewares.authentication }, async (request, reply) => {

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

        const loadedOrders = await em.findAll(entities.order, {
            populate: ['products', 'products.product']
        });

        const totalRecords = loadedOrders.length;
        const pages = Math.floor(totalRecords / pageSize) + 1;

        const paginatedOrders = loadedOrders.slice((page - 1) * pageSize, page * pageSize);

        let orders: Interfaces.Orders.Get['body'] = [];
        for (const order of paginatedOrders) {
            const orderProducts: Interfaces.Orders.Get['body'][number]['products'] = [];
            let total = 0;
            for (const { product, quantity } of order.products) {
                total += quantity * product.price;
                orderProducts.push({
                    id: product.id,
                    name: product.name,
                    reference: product.reference,
                    description: product.description,
                    price: product.price,
                    url: product.url,
                    stock: product.stock,
                    quantity,
                });
            }
            orders.push({
                id: order.id,
                products: orderProducts,
                status: order.status,
                total,
            });
        }

        return reply
            .status(200)
            .send({
                data: orders,
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

    fastify.post('/orders', { preHandler: middlewares.authentication }, async (request, reply) => {

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser)
            return reply.status(401).send("Not auth");

        const cart = request.body as Interfaces.Orders.Create['body'];
        if (!cart.length)
            return reply.status(400).send("Aucun produit");

        const em = orm.em.fork();

        const user = await em.findOne(entities.user, { id: currentUser.id });
        if (!user)
            return reply.status(404).send("User doesn't exist");

        try {
            await em.transactional(async (trx) => {
                const products = await trx.find(entities.product, {
                    id: {
                        $in: cart.map(p => p.id),
                    }
                });

                if (products.length !== cart.length)
                    return reply.status(400).send("Certains produits n'existent plus");

                const cartMap = new Map(cart.map(p => [p.id, p.quantity]));

                for (const product of products) {
                    const quantityRequested = cartMap.get(product.id) || 0;
                    if (product.stock < quantityRequested)
                        return reply.status(400).send(`Stock insuffisant pour le produit ${product.name}`);
                }

                const order = new entities.order();
                order.status = Interfaces.Orders.Status.IN_PROGRESS;
                order.user = user;

                for (const product of products) {
                    const quantityRequested = cartMap.get(product.id) || 0;

                    // Decrease stock
                    product.stock -= quantityRequested;
                    trx.persist(product); // Persist stock update

                    // Create order-product association
                    const orderProduct = new entities.orderProduct();
                    orderProduct.order = order;
                    orderProduct.product = product;
                    orderProduct.quantity = quantityRequested;
                    order.products.add(orderProduct);
                }

                // Persist order
                await trx.persistAndFlush(order);
            })
        } catch (error) {
            console.log(error);
            return reply.status(400).send(`Une erreur est survenue`);
        }

        return reply
            .status(201)
            .send({ message: 'Order successfully created.' });
    });

    fastify.patch('/orders/:id/ship', { preHandler: middlewares.authentication }, async (request, reply) => {

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser || currentUser.role !== Interfaces.Users.Role.ADMINISTRATOR)
            return reply.status(403).send("Not allowed");

        const { id } = request.params as { id: number };

        const em = orm.em.fork();

        const order = await em.findOne(entities.order, {
            id
        });

        if (!order)
            return reply.status(404).send("Not found");

        if (order.status !== Interfaces.Orders.Status.IN_PROGRESS)
            return reply.status(400).send("Can't ship order not in progress");

        order.status = Interfaces.Orders.Status.SHIPPED;

        await em.persistAndFlush(order);

        return reply
            .status(204)
            .send({ message: 'Order successfully shipped.' });
    });

    fastify.patch('/orders/:id/cancel', { preHandler: middlewares.authentication }, async (request, reply) => {

        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser || currentUser.role !== Interfaces.Users.Role.ADMINISTRATOR)
            return reply.status(403).send("Not allowed");

        const { id } = request.params as { id: number };

        const em = orm.em.fork();

        try {
            await em.transactional(async (trx) => {
                const order = await trx.findOne(entities.order, {
                    id
                }, { populate: ['products.product'] });

                if (!order)
                    return reply.status(404).send("Not found");

                if (order.status === Interfaces.Orders.Status.CANCELED)
                    return reply.status(400).send("Can't cancel an already canceled order");

                for (const orderProduct of order.products) {
                    orderProduct.product.stock += orderProduct.quantity;
                    trx.persist(orderProduct.product);
                }

                order.status = Interfaces.Orders.Status.CANCELED;
                await em.persistAndFlush(order);
            });
        } catch (error) {
            console.log(error);
            return reply.status(400).send("An error occured");
        }

        return reply
            .status(204)
            .send({ message: 'Order successfully canceled.' });
    });

    fastify.get('/orders/statistics', { preHandler: middlewares.authentication }, async (request, reply) => {
        // @ts-ignore
        const currentUser: Interfaces.Users.JWTPayload = request.user;
        if (!currentUser || currentUser.role !== Interfaces.Users.Role.ADMINISTRATOR)
            return reply.status(403).send("Not allowed");

        const em = orm.em.fork();

        try {
            const totalOrders = await em.count(entities.order);

            // Get best-selling products
            const orderProducts = await em.find(entities.orderProduct, {}, {
                populate: ['product'],
            });

            const productSalesMap: Record<number, { name: string; quantity: number }> = {};

            for (const orderProduct of orderProducts) {
                const productId = orderProduct.product.id;
                if (!productSalesMap[productId]) {
                    productSalesMap[productId] = {
                        name: orderProduct.product.name,
                        quantity: 0
                    };
                }
                productSalesMap[productId].quantity += orderProduct.quantity;
            }

            // Convert to array and sort by quantity sold
            const bestSelling = Object.values(productSalesMap)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5); // Get top 5 best-selling products

            // Get remaining stock of all products
            const products = await em.find(entities.product, {});
            const stockRemaining = products
                .sort((a, b) => b.stock - a.stock)
                .map(p => ({
                    name: p.name,
                    stock: p.stock
                }));

            const data: Interfaces.Orders.GetStatistics['body'] = {
                totalOrders,
                bestSelling,
                stockRemaining
            };

            return reply.send({
                data
            });
        } catch (error) {
            console.error(error);
            return reply.status(500).send("Error fetching statistics");
        }
    });
}
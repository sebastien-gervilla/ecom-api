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
    fastify.get('/orders', { preHandler: middlewares.authentication }, async (request, reply) => {

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
            populate: ['products']
        });

        const totalRecords = loadedOrders.length;
        const pages = Math.floor(totalRecords / pageSize) + 1;

        const paginatedOrders = loadedOrders.slice((page - 1) * pageSize, page * pageSize);

        let orders: Interfaces.Orders.Get['body'][] = [];
        for (const order of paginatedOrders) {
            console.log(order.products);
            console.log(order.products[0]);
            orders.push({
                id: order.id,
                products: order.products,
                status: order.status,
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

        const products = await em.find(entities.product, {
            id: {
                $in: cart.map(p => p.id),
            }
        });

        if (products.length !== cart.length)
            return reply.status(400).send("Certains produits n'existent plus");

        const order = new entities.order();
        order.status = Interfaces.Orders.Status.IN_PROGRESS;
        order.user = user;

        for (const product of products) {
            const cartProduct = cart.find(p => p.id === product.id);
            if (!cartProduct)
                return reply.status(400).send("Certains produits n'existent plus");

            const orderProduct = new entities.orderProduct();
            orderProduct.quantity = cartProduct.quantity;
            orderProduct.order = order;
            orderProduct.product = product;
            order.products.add(orderProduct);
        }

        await em.persistAndFlush(order);

        return reply
            .status(201)
            .send({ message: 'Order successfully created.' });
    });
}
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

        const loadedOrders = await em.findAll(
            entities.order,
        );

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

}
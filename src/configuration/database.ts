import { MikroORM } from "@mikro-orm/postgresql";
import { entities } from "../entities";
import { Interfaces } from "../interfaces";

export const initializeDatabaseConnection = async (environment: Interfaces.API.Environment) => {
    try {
        const orm = await MikroORM.init({
            host: environment.databaseHost,
            port: environment.databasePort,
            dbName: environment.databaseName,
            user: environment.databaseUser,
            password: environment.databasePass,
            entities: [entities.user, entities.order, entities.product, entities.orderProduct]
        });

        console.log("🐘 Database successfully connected");

        return orm;
    } catch (error) {
        console.log(error);
        throw new Error("Database connection error.");
    }
};
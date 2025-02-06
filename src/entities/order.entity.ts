import { Interfaces } from '../interfaces';
import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { entities } from '.';

@Entity()
export class OrderEntity {
    @PrimaryKey()
    id!: number;

    @OneToMany(() => entities.orderProduct, collection => collection.order)
    products = new Collection<entities.orderProduct>(this);

    @Property()
    status!: Interfaces.Orders.Status;

    @Property({ type: Date })
    createdAt: Date = new Date();

    @Property({ type: Date })
    updatedAt: Date = new Date();
}
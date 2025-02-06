import { Interfaces } from '../interfaces';
import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { user, orderProduct } from './entities';

@Entity()
export class OrderEntity {
    @PrimaryKey()
    id!: number;

    @OneToMany(() => orderProduct, collection => collection.order)
    products = new Collection<orderProduct>(this);

    @ManyToOne(() => user)
    user!: user;

    @Property()
    status!: Interfaces.Orders.Status;

    @Property({ type: Date })
    createdAt: Date = new Date();

    @Property({ type: Date })
    updatedAt: Date = new Date();
}
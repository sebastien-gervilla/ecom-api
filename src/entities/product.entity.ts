import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { entities } from '.';

@Entity()
export class ProductEntity {
    @PrimaryKey()
    id!: number;

    @OneToMany(() => entities.orderProduct, collection => collection.product)
    orders = new Collection<entities.orderProduct>(this);

    @Property({ unique: true })
    name!: string;

    @Property({ unique: true })
    reference!: string;

    @Property()
    description!: string;

    @Property()
    price!: number;

    @Property()
    stock!: number;

    @Property()
    url!: string;

    @Property({ type: Date })
    createdAt: Date = new Date();

    @Property({ type: Date })
    updatedAt: Date = new Date();
}
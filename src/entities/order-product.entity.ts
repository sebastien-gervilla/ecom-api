import { Entity, ManyToOne, Property } from '@mikro-orm/postgresql';
import { order, product } from './entities';

@Entity()
export class OrderProductEntity {
    @ManyToOne(() => order, { primary: true })
    order!: order;

    @ManyToOne(() => product, { primary: true })
    product!: product;

    @Property()
    quantity!: number;

    ['PrimaryKeyProp']?: ['order', 'product'];
}
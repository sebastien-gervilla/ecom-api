import { entities } from '.';
import { Interfaces } from '../interfaces';
import { Collection, Entity, Enum, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
export class UserEntity {
    @PrimaryKey()
    id!: number;

    @Property()
    firstName!: string;

    @Property()
    lastName!: string;

    @Property({ unique: true })
    email!: string;

    @Property({ hidden: true })
    password!: string;

    @Enum(() => Interfaces.Users.Role)
    role!: Interfaces.Users.Role;

    @OneToMany(() => entities.order, collection => collection.user)
    orders = new Collection<entities.orderProduct>(this);

    @Property({ type: Date })
    createdAt: Date = new Date();

    @Property({ type: Date })
    updatedAt: Date = new Date();
}
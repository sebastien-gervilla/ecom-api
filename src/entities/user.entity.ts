import { Interfaces } from '../interfaces';
import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/postgresql';

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

    @Property({ type: Date })
    createdAt: Date = new Date();

    @Property({ type: Date })
    updatedAt: Date = new Date();
}
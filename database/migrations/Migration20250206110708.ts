import { Migration } from '@mikro-orm/migrations';

export class Migration20250206110708 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "order_entity" ("id" serial primary key, "status" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);

    this.addSql(`create table "product_entity" ("id" serial primary key, "name" varchar(255) not null, "description" varchar(255) not null, "price" int not null, "stock" int not null, "url" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "product_entity" add constraint "product_entity_name_unique" unique ("name");`);

    this.addSql(`create table "order_product_entity" ("order_id" int not null, "product_id" int not null, "quantity" int not null, constraint "order_product_entity_pkey" primary key ("order_id", "product_id"));`);

    this.addSql(`create table "user_entity" ("id" serial primary key, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, "role" text check ("role" in ('administrator', 'client')) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "user_entity" add constraint "user_entity_email_unique" unique ("email");`);

    this.addSql(`alter table "order_product_entity" add constraint "order_product_entity_order_id_foreign" foreign key ("order_id") references "order_entity" ("id") on update cascade;`);
    this.addSql(`alter table "order_product_entity" add constraint "order_product_entity_product_id_foreign" foreign key ("product_id") references "product_entity" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "order_product_entity" drop constraint "order_product_entity_order_id_foreign";`);

    this.addSql(`alter table "order_product_entity" drop constraint "order_product_entity_product_id_foreign";`);

    this.addSql(`drop table if exists "order_entity" cascade;`);

    this.addSql(`drop table if exists "product_entity" cascade;`);

    this.addSql(`drop table if exists "order_product_entity" cascade;`);

    this.addSql(`drop table if exists "user_entity" cascade;`);
  }

}

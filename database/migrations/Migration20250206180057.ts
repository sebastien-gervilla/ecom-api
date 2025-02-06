import { Migration } from '@mikro-orm/migrations';

export class Migration20250206180057 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "product_entity" add column "reference" varchar(255) not null;`);
    this.addSql(`alter table "product_entity" add constraint "product_entity_reference_unique" unique ("reference");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "product_entity" drop constraint "product_entity_reference_unique";`);
    this.addSql(`alter table "product_entity" drop column "reference";`);
  }

}

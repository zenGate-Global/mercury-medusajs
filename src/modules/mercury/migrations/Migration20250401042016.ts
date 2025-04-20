import { Migration } from '@mikro-orm/migrations';

export class Migration20250401042016 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "mercury_address" drop constraint if exists "mercury_address_order_id_unique";`);
    this.addSql(`create table if not exists "mercury_address" ("id" text not null, "bech32" text not null, "xpubKey" text not null, "index" numeric not null, "status" text check ("status" in ('idle', 'pending')) not null, "order_id" text null, "raw_index" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mercury_address_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mercury_address_deleted_at" ON "mercury_address" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mercury_address_order_id_unique" ON "mercury_address" (order_id) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "mercury_rate" ("id" text not null, "from" text not null, "to" text not null, "rate" real not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mercury_rate_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mercury_rate_deleted_at" ON "mercury_rate" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mercury_address" cascade;`);

    this.addSql(`drop table if exists "mercury_rate" cascade;`);
  }

}

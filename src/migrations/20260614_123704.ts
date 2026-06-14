import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add teaser column to news table
  await db.run(sql`ALTER TABLE \`news\` ADD \`teaser\` text;`)

  // Add teaser column to blog table as well (for consistency)
  await db.run(sql`ALTER TABLE \`blog\` ADD \`teaser\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Remove teaser column from news table
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_news\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`body\` text NOT NULL,
  	\`category_id\` integer NOT NULL,
  	\`author_id\` integer NOT NULL,
  	\`published_at\` text,
  	\`featured_image_id\` integer,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`legacy_url\` text,
  	\`seo_meta_title\` text,
  	\`seo_meta_description\` text,
  	\`seo_canonical_url\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_news\`("id", "title", "slug", "body", "category_id", "author_id", "published_at", "featured_image_id", "status", "legacy_url", "seo_meta_title", "seo_meta_description", "seo_canonical_url", "updated_at", "created_at") SELECT "id", "title", "slug", "body", "category_id", "author_id", "published_at", "featured_image_id", "status", "legacy_url", "seo_meta_title", "seo_meta_description", "seo_canonical_url", "updated_at", "created_at" FROM \`news\`;`,
  )
  await db.run(sql`DROP TABLE \`news\`;`)
  await db.run(sql`ALTER TABLE \`__new_news\` RENAME TO \`news\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)

  // Recreate indexes for news table
  await db.run(sql`CREATE UNIQUE INDEX \`news_slug_idx\` ON \`news\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`news_category_idx\` ON \`news\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`news_author_idx\` ON \`news\` (\`author_id\`);`)
  await db.run(sql`CREATE INDEX \`news_featured_image_idx\` ON \`news\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`news_legacy_url_idx\` ON \`news\` (\`legacy_url\`);`)
  await db.run(sql`CREATE INDEX \`news_updated_at_idx\` ON \`news\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`news_created_at_idx\` ON \`news\` (\`created_at\`);`)

  // Remove teaser column from blog table
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_blog\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`body\` text NOT NULL,
  	\`category_id\` integer,
  	\`author_id\` integer NOT NULL,
  	\`published_at\` text,
  	\`featured_image_id\` integer,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`legacy_url\` text,
  	\`seo_meta_title\` text,
  	\`seo_meta_description\` text,
  	\`seo_canonical_url\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_blog\`("id", "title", "slug", "body", "category_id", "author_id", "published_at", "featured_image_id", "status", "legacy_url", "seo_meta_title", "seo_meta_description", "seo_canonical_url", "updated_at", "created_at") SELECT "id", "title", "slug", "body", "category_id", "author_id", "published_at", "featured_image_id", "status", "legacy_url", "seo_meta_title", "seo_meta_description", "seo_canonical_url", "updated_at", "created_at" FROM \`blog\`;`,
  )
  await db.run(sql`DROP TABLE \`blog\`;`)
  await db.run(sql`ALTER TABLE \`__new_blog\` RENAME TO \`blog\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)

  // Recreate indexes for blog table
  await db.run(sql`CREATE UNIQUE INDEX \`blog_slug_idx\` ON \`blog\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`blog_category_idx\` ON \`blog\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_author_idx\` ON \`blog\` (\`author_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_featured_image_idx\` ON \`blog\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_legacy_url_idx\` ON \`blog\` (\`legacy_url\`);`)
  await db.run(sql`CREATE INDEX \`blog_updated_at_idx\` ON \`blog\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`blog_created_at_idx\` ON \`blog\` (\`created_at\`);`)
}

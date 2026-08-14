import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_published_at_idx\` ON \`news\` (\`published_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`blog_published_at_idx\` ON \`blog\` (\`published_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`news_published_at_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`blog_published_at_idx\`;`)
}
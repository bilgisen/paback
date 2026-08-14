import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_status_idx\` ON \`news\` (\`status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`blog_status_idx\` ON \`blog\` (\`status\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`news_status_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`blog_status_idx\`;`)
}
// adapters/sqlite-metadata.ts
import { Database } from "bun:sqlite";
import type { MetadataAdapter } from "./IMetadataAdapter";
import type { BlobMetadata } from "../../domain/blob";

export class SQLiteMetadataAdapter implements MetadataAdapter {
  private db: Database;

  constructor(dbPath: string = "blobs.db") {
    this.db = new Database(dbPath, { create: true });
    this.migrate();
  }

  private migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS blobs (
        id TEXT PRIMARY KEY,
        pathname TEXT UNIQUE NOT NULL,
        content_type TEXT,
        size INTEGER,
        uploaded_at TEXT,
        url TEXT
      )
    `);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_pathname ON blobs(pathname)`);
  }
  async list(): Promise<BlobMetadata[]> {
    const rows = this.db.query("SELECT * FROM blobs").all();
    return rows as BlobMetadata[];
  }

  async getByPath(path: string): Promise<BlobMetadata | null> {
    const row = this.db
      .query("SELECT * FROM blobs WHERE pathname = ?")
      .get(path);

    if (!row) return null;

    return row ? (row as BlobMetadata) : null;
  }

  async save(blob: BlobMetadata): Promise<void> {
    this.db.run(
      `INSERT OR REPLACE INTO blobs (id, pathname, content_type, size, uploaded_at, url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        blob.id,
        blob.pathname,
        blob.contentType,
        blob.size,
        blob.uploadedAt.toISOString(),
        blob.url,
      ],
    );
  }

  async deleteByPath(path: string): Promise<void> {
    this.db.run("DELETE FROM blobs WHERE pathname = ?", [path]);
  }
}

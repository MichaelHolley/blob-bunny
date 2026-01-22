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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        content_type TEXT,
        size INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_path ON blobs(path)`);
  }
  async list(): Promise<BlobMetadata[]> {
    const rows = this.db.query("SELECT * FROM blobs").all();
    return rows as BlobMetadata[];
  }

  async getByPath(path: string): Promise<BlobMetadata | null> {
    const row = this.db.query("SELECT * FROM blobs WHERE path = ?").get(path);

    if (!row) return null;

    return row ? (row as BlobMetadata) : null;
  }

  async save(blob: CreateMetadataBlob): Promise<void> {
    this.db.run(
      `INSERT OR REPLACE INTO blobs (path, content_type, size)
       VALUES (?, ?, ?)`,
      [blob.path, blob.contentType, blob.size],
    );
  }

  async deleteByPath(path: string): Promise<void> {
    this.db.run("DELETE FROM blobs WHERE path = ?", [path]);
  }
}

type CreateMetadataBlob = Pick<BlobMetadata, "path" | "contentType" | "size">;

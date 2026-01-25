// adapters/sqlite-metadata.ts
import { Database } from "bun:sqlite";
import type { MetadataAdapter } from "./IMetadataAdapter";
import type { BlobMetadata } from "../../domain/blob";
import type { CreateMetadataBlob } from "./types";

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
        pathname TEXT UNIQUE NOT NULL,
        content_type TEXT,
        size INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_pathname ON blobs(pathname)`);
  }
  async list(): Promise<BlobMetadata[]> {
    const rows = this.db.query("SELECT * FROM blobs").all();
    return rows.map((row) => this.mapRowToBlobMetadata(row));
  }

  async getByPathname(pathname: string): Promise<BlobMetadata | null> {
    const row = this.db.query("SELECT * FROM blobs WHERE pathname = ?").get(pathname);

    if (!row) return null;

    return row ? this.mapRowToBlobMetadata(row) : null;
  }

  async save(blob: CreateMetadataBlob): Promise<void> {
    this.db.run(
      `INSERT OR REPLACE INTO blobs (pathname, content_type, size)
       VALUES (?, ?, ?)`,
      [blob.pathname, blob.contentType, blob.size],
    );
  }

  async deleteByPathname(pathname: string): Promise<void> {
    this.db.run("DELETE FROM blobs WHERE pathname = ?", [pathname]);
  }

  private mapRowToBlobMetadata(row: any): BlobMetadata {
    return {
      id: row.id,
      contentType: row.content_type,
      pathname: row.pathname,
      size: row.size,
      uploadedAt: new Date(row.uploaded_at),
    };
  }
}

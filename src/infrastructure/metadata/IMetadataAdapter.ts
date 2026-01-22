import type { BlobMetadata } from "../../domain/blob";

export interface MetadataAdapter {
  list(): Promise<BlobMetadata[]>;
  save(blob: BlobMetadata): Promise<void>;
  getByPath(path: string): Promise<BlobMetadata | null>;
  deleteByPath(path: string): Promise<void>;
}

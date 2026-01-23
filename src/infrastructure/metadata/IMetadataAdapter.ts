import type { BlobMetadata } from "../../domain/blob";

export interface MetadataAdapter {
  list(): Promise<BlobMetadata[]>;
  save(blob: BlobMetadata): Promise<void>;
  getByPathname(pathname: string): Promise<BlobMetadata | null>;
  deleteByPathname(pathname: string): Promise<void>;
}

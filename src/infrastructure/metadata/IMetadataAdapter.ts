import type { BlobMetadata } from "../../domain/blob";
import type { CreateMetadataBlob } from "./types";

export interface MetadataAdapter {
  list(): Promise<BlobMetadata[]>;
  save(blob: CreateMetadataBlob): Promise<void>;
  getByPathname(pathname: string): Promise<BlobMetadata | null>;
  deleteByPathname(pathname: string): Promise<void>;
}

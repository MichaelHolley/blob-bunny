import type { BlobMetadata } from "../../domain/blob";

export type CreateMetadataBlob = Pick<BlobMetadata, "pathname" | "contentType" | "size">;

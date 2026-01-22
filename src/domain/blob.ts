export interface BlobMetadata {
  id: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

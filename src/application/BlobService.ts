import { join, relative, resolve } from "path";
import type { BlobMetadata } from "../domain/blob";
import type { MetadataAdapter } from "../infrastructure/metadata/IMetadataAdapter";

export interface BlobUploadOptions {
  pathname: string;
  file: File;
}

export class BlobService {
  private blobDataDir: string;

  constructor(
    private metadataAdapter: MetadataAdapter,
    blobDataDir: string,
  ) {
    this.blobDataDir = resolve(blobDataDir);
  }

  /**
   * Sanitizes a pathname to prevent directory traversal attacks.
   * Ensures the resolved path stays within the blob data directory.
   * @throws Error if path traversal is detected
   */
  private sanitizePath(pathname: string): string {
    // Remove leading slashes
    const cleaned = pathname.replace(/^\/+/, "");

    // Resolve the full path
    const fullPath = resolve(join(this.blobDataDir, cleaned));

    // Verify the path stays within the base directory
    const relativePath = relative(this.blobDataDir, fullPath);

    // Check for directory traversal attempts
    if (relativePath.startsWith("..") || resolve(relativePath) === relativePath) {
      throw new Error(`Invalid path: directory traversal detected in "${pathname}"`);
    }

    return fullPath;
  }

  async list(): Promise<BlobMetadata[]> {
    return await this.metadataAdapter.list();
  }

  async upload(options: BlobUploadOptions): Promise<void> {
    const { pathname, file } = options;
    const writeTo = this.sanitizePath(pathname);

    console.log(`Saving file to ${writeTo}`);
    await Bun.write(writeTo, file);

    await this.metadataAdapter.save({
      pathname,
      contentType: file.type,
      size: file.size,
    });
  }

  async get(
    pathname: string,
  ): Promise<{ file: ReturnType<typeof Bun.file>; metadata: BlobMetadata } | null> {
    const blob = await this.metadataAdapter.getByPathname(pathname);
    if (!blob) {
      return null;
    }

    const sanitizedPath = this.sanitizePath(blob.pathname);
    const file = Bun.file(sanitizedPath);
    return { file, metadata: blob };
  }

  async delete(pathname: string): Promise<boolean> {
    const blob = await this.metadataAdapter.getByPathname(pathname);
    if (!blob) {
      return false;
    }

    await this.metadataAdapter.deleteByPathname(pathname);

    const deleteAt = this.sanitizePath(pathname);
    const file = Bun.file(deleteAt);

    const fileExists = await file.exists();
    if (!fileExists) {
      return false;
    }

    console.log(`Deleting file at ${deleteAt}`);

    await file.delete();
    return true;
  }
}

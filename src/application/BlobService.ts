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
   * Validates pathname input to prevent various attack vectors.
   * @throws Error if validation fails
   */
  private validatePathname(pathname: string): void {
    // Check for null/undefined/empty
    if (!pathname || typeof pathname !== "string") {
      throw new Error("Invalid path: pathname is required and must be a string");
    }

    // Trim the pathname
    const trimmed = pathname.trim();

    // Check for directory traversal patterns BEFORE stripping slashes
    if (trimmed.includes("..")) {
      throw new Error("Invalid path: directory traversal patterns (..) are not allowed");
    }

    // Remove leading slashes for further validation
    const cleaned = trimmed.replace(/^\/+/, "");

    // Check minimum length after removing leading slashes
    if (cleaned.length === 0) {
      throw new Error("Invalid path: pathname cannot be empty");
    }

    // Check maximum length (255 characters is standard filesystem limit)
    if (cleaned.length > 255) {
      throw new Error(
        `Invalid path: pathname too long (max 255 characters, got ${cleaned.length})`,
      );
    }

    // Block hidden files (starting with dot after path separators)
    const pathParts = cleaned.split("/");
    for (const part of pathParts) {
      if (part.startsWith(".")) {
        throw new Error("Invalid path: hidden files/directories (starting with .) are not allowed");
      }
    }

    // Block null bytes and control characters
    if (/[\x00-\x1F\x7F]/.test(cleaned)) {
      throw new Error("Invalid path: null bytes and control characters are not allowed");
    }

    // Validate allowed characters (alphanumeric, dash, underscore, dot, forward slash)
    const allowedCharsRegex = /^[a-zA-Z0-9._\-\/]+$/;
    if (!allowedCharsRegex.test(cleaned)) {
      throw new Error(
        "Invalid path: only alphanumeric characters, dash, underscore, dot, and forward slash are allowed",
      );
    }

    // Validate file extension exists and is reasonable
    const filename = pathParts[pathParts.length - 1];

    if (!filename || !filename.includes(".")) {
      throw new Error("Invalid path: filename must have an extension");
    }

    const extensionParts = filename.split(".");
    const extension = extensionParts[extensionParts.length - 1];
    if (!extension || extension.length === 0 || extension.length > 10) {
      throw new Error("Invalid path: file extension is invalid or too long");
    }
  }

  /**
   * Sanitizes a pathname to prevent directory traversal attacks.
   * Ensures the resolved path stays within the blob data directory.
   * @throws Error if path traversal is detected
   */
  private sanitizePath(pathname: string): string {
    // Validate input first
    this.validatePathname(pathname);

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

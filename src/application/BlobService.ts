import type { MetadataAdapter } from "../infrastructure/metadata/IMetadataAdapter";
import type { BlobMetadata } from "../domain/blob";

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
    this.blobDataDir = blobDataDir;
  }

  async list(): Promise<BlobMetadata[]> {
    return await this.metadataAdapter.list();
  }

  async upload(options: BlobUploadOptions): Promise<void> {
    const { pathname, file } = options;
    const writeTo = `${this.blobDataDir}${pathname}`;

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

    const file = Bun.file(`${this.blobDataDir}${blob.pathname}`);
    return { file, metadata: blob };
  }

  async delete(pathname: string): Promise<boolean> {
    const blob = await this.metadataAdapter.getByPathname(pathname);
    if (!blob) {
      return false;
    }

    await this.metadataAdapter.deleteByPathname(pathname);

    const deleteAt = `${this.blobDataDir}${pathname}`;
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

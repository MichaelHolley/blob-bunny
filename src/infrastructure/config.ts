import { resolve } from "path";

/**
 * Gets the directory where blob data is stored.
 * @returns The absolute path to the data directory.
 * @throws Error if BLOB_BUNNY_DATA_DIR is not set.
 */
export function getDataDir(): string {
  const dataDir = Bun.env.BLOB_BUNNY_DATA_DIR;
  if (!dataDir) {
    throw new Error("BLOB_BUNNY_DATA_DIR environment variable is not set");
  }
  return resolve(dataDir);
}

/**
 * Gets the maximum allowed file size for uploads.
 * @returns The maximum file size in bytes.
 * @throws Error if BLOB_BUNNY_MAX_FILE_SIZE is set but invalid.
 */
export function getMaxFileSize(): number {
  const maxFileSize = Bun.env.BLOB_BUNNY_MAX_FILE_SIZE;
  
  // Parse max file size with default of 100MB
  const maxFileSizeBytes = maxFileSize 
    ? parseInt(maxFileSize, 10) 
    : 104857600;

  if (isNaN(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error("BLOB_BUNNY_MAX_FILE_SIZE must be a positive number");
  }

  return maxFileSizeBytes;
}

/**
 * Gets the API token for bearer authentication.
 * @returns The API token.
 * @throws Error if BLOB_BUNNY_API_TOKEN is not set.
 */
export function getApiToken(): string {
  const token = Bun.env.BLOB_BUNNY_API_TOKEN;
  if (!token) {
    throw new Error("BLOB_BUNNY_API_TOKEN environment variable is not set");
  }
  return token;
}

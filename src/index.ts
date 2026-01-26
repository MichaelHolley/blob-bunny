import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { BlobService } from "./application/BlobService";
import { SQLiteMetadataAdapter } from "./infrastructure/metadata/SQLiteMetadataAdapter";
import { HTTPException } from "hono/http-exception";

const TOKEN = Bun.env.BLOB_BUNNY_API_TOKEN;
const DATA_DIR = Bun.env.BLOB_BUNNY_DATA_DIR;
const MAX_FILE_SIZE = Bun.env.BLOB_BUNNY_MAX_FILE_SIZE;

if (!TOKEN) {
  throw new Error("BLOB_BUNNY_API_TOKEN environment variable is not set");
}

if (!DATA_DIR) {
  throw new Error("BLOB_BUNNY_DATA_DIR environment variable is not set");
}

// Parse max file size with default of 100MB
const maxFileSizeBytes = MAX_FILE_SIZE 
  ? parseInt(MAX_FILE_SIZE, 10) 
  : 104857600;

if (isNaN(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
  throw new Error("BLOB_BUNNY_MAX_FILE_SIZE must be a positive number");
}

const metadataAdapter = new SQLiteMetadataAdapter("blobs.db");
const blobService = new BlobService(metadataAdapter, DATA_DIR, maxFileSizeBytes);

const app = new Hono();

app.use("*", bearerAuth({ token: TOKEN }));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }

  console.error(err);
  return c.json({ message: err.message }, 400);
});

// List all blobs
app.get("/api/blobs", async (c) => {
  const blobs = await blobService.list();
  return c.json(blobs);
});

// Upload a blob
app.post("/*", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const pathname = new URL(c.req.url).pathname;

  await blobService.upload({ pathname, file });

  return c.text("Uploaded", 201);
});

// Get a blob
app.get("/*", async (c) => {
  const pathname = new URL(c.req.url).pathname;
  const result = await blobService.get(pathname);

  if (!result) {
    return c.text("Not found", 404);
  }

  return new Response(result.file, {
    status: 200,
    headers: {
      "Content-Type": result.metadata.contentType,
      "Content-Length": result.metadata.size.toString(),
    },
  });
});

// Delete a blob
app.delete("/*", async (c) => {
  const pathname = new URL(c.req.url).pathname;
  const deleted = await blobService.delete(pathname);

  if (!deleted) {
    return c.text("Not found", 404);
  }

  return c.text("Deleted", 200);
});

export default app;

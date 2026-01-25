import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { BlobService } from "./application/BlobService";
import { SQLiteMetadataAdapter } from "./infrastructure/metadata/SQLiteMetadataAdapter";

const metadataAdapter = new SQLiteMetadataAdapter("blobs.db");
const blobService = new BlobService(metadataAdapter, "./blob-data");

const app = new Hono();

const token = Bun.env.BLOB_BUNNY_API_TOKEN;

if (!token) {
  throw new Error("BLOB_BUNNY_API_TOKEN environment variable is not set");
}

app.use("*", bearerAuth({ token }));

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

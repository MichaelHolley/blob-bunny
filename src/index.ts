import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { BlobService } from "./application/BlobService";
import { SQLiteMetadataAdapter } from "./infrastructure/metadata/SQLiteMetadataAdapter";
import { HTTPException } from "hono/http-exception";
import { getApiToken } from "./infrastructure/config";

const metadataAdapter = new SQLiteMetadataAdapter("blobs.db");
const blobService = new BlobService(metadataAdapter);

const app = new Hono();

app.use("*", bearerAuth({ token: getApiToken() }));

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

  const etag = `W/"${result.metadata.size}-${result.metadata.uploadedAt.getTime()}"`;

  if (c.req.header("If-None-Match") === etag) {
    return c.body(null, 304, {
      ETag: etag,
      "Cache-Control": "public, max-age=3600",
    });
  }

  return new Response(result.file, {
    status: 200,
    headers: {
      "Content-Type": result.metadata.contentType,
      "Content-Length": result.metadata.size.toString(),
      ETag: etag,
      "Cache-Control": "public, max-age=3600",
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

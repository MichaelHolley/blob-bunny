import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { logger } from "hono/logger";
import { BlobService } from "./application/BlobService";
import { SQLiteMetadataAdapter } from "./infrastructure/metadata/SQLiteMetadataAdapter";
import { HTTPException } from "hono/http-exception";
import { getApiToken } from "./infrastructure/config";

const metadataAdapter = new SQLiteMetadataAdapter("blobs.db");
const blobService = new BlobService(metadataAdapter);

const app = new Hono();

// Log every request: method, path, status, and duration.
app.use("*", logger());

app.use("*", bearerAuth({ token: getApiToken() }));

app.onError((err, c) => {
  const isHttpException = err instanceof HTTPException;
  const status = isHttpException ? err.status : 400;

  // HTTPExceptions thrown by middleware (e.g. bearerAuth's 401) often carry an
  // empty message, which previously produced an unhelpful `{"message":""}`.
  const message = err.message || `Request failed with status ${status}`;

  const where = `${c.req.method} ${c.req.path} -> ${status}: ${message}`;
  // Expected client errors (auth, validation) get a one-liner; anything
  // unexpected gets the full stack for debugging.
  if (isHttpException) {
    console.warn(where);
  } else {
    console.error(where, err);
  }

  return c.json({ message }, status);
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

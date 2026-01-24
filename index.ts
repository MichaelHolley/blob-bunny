import { SQLiteMetadataAdapter } from "./src/infrastructure/metadata/SQLiteMetadataAdapter";

const metadataAdapter = new SQLiteMetadataAdapter("blobs.db");

const BLOB_DATA_DIR = "./blob-data";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/api/blobs": {
      GET: async () => {
        // Get list of blobs
        const blobs = await metadataAdapter.list();
        return Response.json(blobs);
      },
    },
    "/*": {
      POST: async (req) => {
        // Upload new blob
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const pathname = new URL(req.url).pathname;

        const writeTo = `${BLOB_DATA_DIR}${pathname}`;
        console.log(`Saving file to ${writeTo}`);
        await Bun.write(writeTo, file);
        metadataAdapter.save({
          pathname,
          contentType: file.type,
          size: file.size,
        });

        return new Response("Uploaded", { status: 201 });
      },
      GET: async (req) => {
        // Get blob
        const pathname = new URL(req.url).pathname;
        const blob = await metadataAdapter.getByPathname(pathname);
        if (!blob) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(Bun.file(`${BLOB_DATA_DIR}${blob.pathname}`), {
          headers: {
            "Content-Type": blob.contentType,
            "Content-Length": blob.size.toString(),
          },
        });
      },
      DELETE: async (req) => {
        // Delete blob
        const pathname = new URL(req.url).pathname;

        const blob = await metadataAdapter.getByPathname(pathname);
        if (!blob) {
          return new Response("Not found", { status: 404 });
        }

        await metadataAdapter.deleteByPathname(pathname);

        const deleteAt = `${BLOB_DATA_DIR}${pathname}`;
        const file = Bun.file(deleteAt);

        const fileExists = await file.exists();
        if (!fileExists) {
          return new Response("Not found", { status: 404 });
        }

        await file.delete();

        return new Response("Deleted", { status: 200 });
      },
    },
  },
});

console.log(`Listening on ${server.url}`);

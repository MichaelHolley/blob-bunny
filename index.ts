import { SQLiteMetadataAdapter } from "./src/infrastructure/metadata/SQLiteMetadataAdapter";
import { BlobService } from "./src/application/BlobService";

const metadataAdapter = new SQLiteMetadataAdapter("blobs.db");
const blobService = new BlobService(metadataAdapter, "./blob-data");

const server = Bun.serve({
  port: 3000,
  routes: {
    "/api/blobs": {
      GET: async () => {
        const blobs = await blobService.list();
        return Response.json(blobs);
      },
    },
    "/*": {
      POST: async (req) => {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const pathname = new URL(req.url).pathname;

        await blobService.upload({ pathname, file });

        return new Response("Uploaded", { status: 201 });
      },
      GET: async (req) => {
        const pathname = new URL(req.url).pathname;
        const result = await blobService.get(pathname);
        
        if (!result) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(result.file, {
          headers: {
            "Content-Type": result.metadata.contentType,
            "Content-Length": result.metadata.size.toString(),
          },
        });
      },
      DELETE: async (req) => {
        const pathname = new URL(req.url).pathname;
        const deleted = await blobService.delete(pathname);

        if (!deleted) {
          return new Response("Not found", { status: 404 });
        }

        return new Response("Deleted", { status: 200 });
      },
    },
  },
});

console.log(`Listening on ${server.url}`);


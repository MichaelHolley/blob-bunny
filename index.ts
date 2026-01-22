import { SQLiteMetadataAdapter } from "./src/infrastructure/metadata/SQLiteMetadataAdapter";

const metadataAdapter = new SQLiteMetadataAdapter("blobs.db");

const server = Bun.serve({
  port: 3000,
  routes: {
    "/api/blobs": {
      GET: async () => {
        // Get list of blobs
        const blobs = await metadataAdapter.list(); // TODO: replace with service
        return Response.json(blobs);
      },
      POST: async (req) => {
        // Upload new blob
        return new Response("Not implemented", { status: 501 }); // TODO: implement upload logic
      },
    },
    "/:path": {
      GET: async (req) => {
        // Retrieve blob at params.path
        const blob = await metadataAdapter.getByPath(req.params.path); // TODO: replace with service
        if (!blob) {
          return new Response("Not found", { status: 404 });
        }

        return Response.json(blob);
      },
      DELETE: async (req) => {
        // Delete blob at params.path
        await metadataAdapter.deleteByPath(req.params.path); // TODO: replace with service
        return new Response("Deleted", { status: 200 });
      },
    },
  },
});

console.log(`Listening on ${server.url}`);

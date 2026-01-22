import { SQLiteMetadataAdapter } from "./src/infrastructure/metadata/SQLiteMetadataAdapter";

const BASE_URL = import.meta.env.BASE_URL || "http://localhost:3000";

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
        const formData = await req.formData();
        const file = formData.get("file") as File;
        Bun.write(`./blob-data/${file.name}`, file);

        metadataAdapter.save({
          path: `/blob-data/${file.name}`,
          contentType: file.type,
          size: file.size,
        }); // TODO: replace with service

        return Response.json({ url: `${BASE_URL}/blob-data/${file.name}` }); // TODO: implement upload logic
      },
    },
    "/*": {
      GET: async (req) => {
        // Retrieve blob at params.path
        const path = req.url.replace(BASE_URL, "");
        const blob = await metadataAdapter.getByPath(path); // TODO: replace with service
        if (!blob) {
          return new Response("Not found", { status: 404 });
        }

        console.log(blob);

        return new Response(Bun.file(`.${blob.path}`), {
          headers: {
            "Content-Type": blob.contentType,
            "Content-Length": blob.size.toString(),
          },
        });
      },
      DELETE: async (req) => {
        // Delete blob at params.path
        const path = req.url.replace(BASE_URL, "");
        await metadataAdapter.deleteByPath(path); // TODO: replace with service
        return new Response("Deleted", { status: 200 });
      },
    },
  },
});

console.log(`Listening on ${server.url}`);

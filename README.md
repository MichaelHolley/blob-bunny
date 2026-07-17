# blob-bunny

A simplistic blob-storage solution built with native bun features.

## setup

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## docker

```yaml
services:
  blob-bunny:
    image: mpholley/blob-bunny:latest
    restart: unless-stopped
    ports:
      - "5000:3000"
    environment:
      BLOB_BUNNY_API_TOKEN: your_api_token
      BLOB_BUNNY_DATA_DIR: /data/blob-data
      BLOB_BUNNY_MAX_FILE_SIZE: "104857600"
      PORT: "3000"
    volumes:
      - blob-data:/data

volumes:
  blob-data:
```

## endpoints

All endpoints require a `Authorization: Bearer <token>` header.

| Method | Path | Operation | Params |
| --- | --- | --- | --- |
| `GET` | `/api/blobs` | List all blob metadata | None |
| `POST` | `/*` | Upload a blob to the request path | Body: `multipart/form-data` with a `file` field |
| `GET` | `/*` | Download the blob at the request path | Optional header: `If-None-Match` (ETag for conditional requests) |
| `DELETE` | `/*` | Delete the blob at the request path | None |

# blob-bunny

A simplistic blob-storage solution built with native bun features.

## Architecture

A modular blob storage system with a core abstraction layer and swappable adapters for metadata storage (SQLite) and file storage (filesystem).

```
┌─────────────────────────────────────────────────┐
│              Bun HTTP Server (API)              │
├─────────────────────────────────────────────────┤
│              BlobService (Core Logic)           │
├──────────────────────┬──────────────────────────┤
│  MetadataAdapter     │     StorageAdapter       │
│  (SQLite)            │     (Filesystem)         │
└──────────────────────┴──────────────────────────┘
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

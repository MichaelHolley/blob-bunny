# Agent Guidelines for Blob Bunny

**Stack**: Bun runtime, TypeScript (ESNext, strict mode), Hono framework, SQLite, Clean Architecture (domain → application → infrastructure)

## Commands

```bash
bun run dev          # Dev server with hot reload
bun run build        # Build for production
bun run lint:fix     # Auto-fix lint issues (oxlint)
bun run fmt          # Format code (oxfmt)
bun test             # Run tests (no framework configured yet - use bun:test if adding)
```

## Code Style

**Imports**: Use `import type { ... }` for type-only imports. Order: external deps → internal types → internal modules → relative imports.

**Naming**: PascalCase for classes/interfaces (`BlobService`, `BlobMetadata`), camelCase for functions/methods (`sanitizePath`). Use `I` prefix only for infrastructure adapters (`IMetadataAdapter`).

**Types**: Always type function params and return types. Use interfaces for object shapes, type aliases for unions/intersections. `noUncheckedIndexedAccess: true` means array access returns `T | undefined`.

**Errors**: Throw descriptive errors with context. Use `HTTPException` from Hono for HTTP errors. Global error handler in `index.ts` catches all.

**Environment**: Access via `Bun.env`. Always validate in `src/infrastructure/config.ts`. Required: `BLOB_BUNNY_API_TOKEN`, `BLOB_BUNNY_DATA_DIR`, `BLOB_BUNNY_MAX_FILE_SIZE`.

**Security**: Always use `sanitizePath()` before file operations. Validate all inputs. Server-side MIME detection with `file-type` library.

**Docs**: JSDoc for public APIs with `@throws`, `@returns`, `@param`. Inline comments for non-obvious logic only.

**Architecture**: Domain layer (pure TS, no deps) → Application layer (business logic) → Infrastructure layer (DB, config, adapters). Use constructor injection for dependencies.

**Git**: Run `bun run fmt && bun run lint:fix` before committing. Use conventional commits using feat:, fix:, chore: prefix. Present tense commit messages ("Add feature" not "Added feature").

## Resources

When you need to search docs, use context7 tools.

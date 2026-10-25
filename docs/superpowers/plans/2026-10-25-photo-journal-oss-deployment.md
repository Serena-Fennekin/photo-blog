# Photography Journal OSS and Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local media with Alibaba Cloud OSS direct upload and image processing, then deploy, back up, secure, and monitor the complete application on the 2-core/2-GB Hangzhou ECS.

**Architecture:** The existing `MediaProvider` gains an OSS implementation that returns tightly scoped browser upload policies, reads image metadata, and requests persistent derivatives without moving full originals through the app. Docker Compose runs only Caddy and the Nuxt application; OSS/CDN carry public image traffic and private OSS stores database backups.

**Tech Stack:** Alibaba Cloud OSS SDK, OSS image processing, Alibaba CDN, Nuxt 4, SQLite, Docker Compose, Caddy, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-10-25-photo-journal-design.md`

## Global Constraints

- Complete both preceding plans before this plan.
- Execute only in the Git repository established for the preceding plans.
- Place original and display media in separate protected scopes; original object URLs must never appear in public JSON or HTML.
- Use the Hangzhou OSS region and its internal endpoint for server-to-OSS operations.
- Browser upload policies expire quickly and restrict key prefix, MIME type, and size.
- Use immutable derivative keys containing photo ID, content version, width, and format.
- Public image traffic uses the CDN hostname; the Nuxt process never proxies display bytes in production.
- Secrets are environment variables or secret files and are never committed.
- A deployment must back up SQLite before migration; recovery must be tested, not merely documented.

## Review Focus

- A forged upload that changes key prefix, size, or MIME must be rejected before it becomes publishable — Task 1 test.
- Re-running a derivative job after timeout must be idempotent and must not duplicate database rows or objects — Task 2 test.
- Public payloads and rendered HTML must never reveal private-bucket endpoints or original keys — Task 3 test.
- A failed pre-deploy backup must abort migration and restart — Task 5 test.
- With OSS unavailable, publishing must remain draft/retryable while already published content stays readable — Task 6 test.

---

## File Structure

```text
server/media/oss-media-provider.ts
server/media/oss-client.ts
server/tasks/process-media-jobs.ts
server/tasks/cleanup-media-jobs.ts
server/backup/sqlite-backup.ts
server/health/health-service.ts
server/api/health.get.ts
scripts/backup.ts, restore-backup.ts, smoke-production.ts
deploy/Caddyfile
deploy/docker-compose.yml
deploy/app.Dockerfile
deploy/backup.ps1, deploy.ps1
docs/deployment.md, docs/operations-runbook.md, docs/disaster-recovery.md
tests/unit, tests/integration, tests/e2e
```

## Task 1: OSS client and constrained browser direct upload

**Files:**
- Create: `server/media/oss-client.ts`, `server/media/oss-media-provider.ts`
- Modify: `server/media/media-provider.ts`, `server/api/admin/media/upload.post.ts`, `nuxt.config.ts`
- Test: `tests/unit/oss-upload-policy.test.ts`, `tests/integration/oss-media-provider.test.ts`

**Interfaces:**
- Consumes: `MediaProvider` from the admin/data phase.
- Produces: `createOssMediaProvider(config: OssMediaConfig): MediaProvider`.
- Produces: the existing `UploadTarget` with `method: 'POST'` and populated `fields` for OSS form upload.

- [ ] **Step 1: Write failing policy tests**

Assert expiry is at most ten minutes, key is restricted to the current admin upload prefix, configured max bytes and allowed image MIME types appear in policy conditions, filenames cannot inject paths, and no long-lived OSS secret reaches the response.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/oss-upload-policy.test.ts tests/integration/oss-media-provider.test.ts`

Expected: FAIL because OSS modules do not exist.

- [ ] **Step 3: Implement the OSS adapter and completion verification**

Use the Hangzhou internal endpoint for server calls and the configured upload endpoint for browser POSTs. After upload, verify object existence, content length, actual image info, and expected key before marking it `uploaded`.

- [ ] **Step 4: Run provider verification**

Run: `npm test -- tests/unit/oss-upload-policy.test.ts tests/integration/oss-media-provider.test.ts && npm run typecheck`

Expected: all tests pass using a fake OSS transport; live credentials are not required.

- [ ] **Step 5: Commit**

```bash
git add server/media server/api/admin/media/upload.post.ts nuxt.config.ts tests
git commit -m "feat: upload originals directly to oss"
```

## Task 2: Sanitized metadata and idempotent OSS derivatives

**Files:**
- Create: `server/tasks/process-media-jobs.ts`, `server/tasks/cleanup-media-jobs.ts`
- Modify: `server/media/oss-media-provider.ts`, `server/services/media-service.ts`, `server/db/schema.ts`
- Test: `tests/unit/derivative-key.test.ts`, `tests/integration/media-job-runner.test.ts`

**Interfaces:**
- Produces: `buildDerivativeKey(input: { photoId: string; version: string; width: number; format: 'webp' | 'jpg' }): string`.
- Produces: `runNextMediaJob(db, provider, now): Promise<'processed' | 'failed' | 'idle'>`.

- [ ] **Step 1: Write failing processing tests**

Assert exact width variants, WebP plus JPEG fallback, sanitized public EXIF, immutable keys, retry backoff, idempotent timeout recovery, one-photo failure isolation, and delayed cleanup never deleting a referenced object.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/derivative-key.test.ts tests/integration/media-job-runner.test.ts`

Expected: FAIL because job runner and key builder do not exist.

- [ ] **Step 3: Implement persistent OSS processing**

Read OSS image info, apply the server whitelist, request persisted resized derivatives, then transactionally mark the photo ready with dimensions and derivative keys. Claim jobs with a lease so one process can safely recover abandoned work.

- [ ] **Step 4: Verify processing and retry behavior**

Run: `npm test -- tests/unit/derivative-key.test.ts tests/integration/media-job-runner.test.ts`

Expected: all commands exit 0, including two consecutive executions of the same leased job.

- [ ] **Step 5: Commit**

```bash
git add server/tasks server/media/oss-media-provider.ts server/services/media-service.ts server/db tests
git commit -m "feat: process immutable oss image derivatives"
```

## Task 3: CDN-only public image URLs and caching

**Files:**
- Create: `server/media/public-image-url.ts`
- Modify: `server/repositories/drizzle-content-repository.ts`, `app/components/gallery/GalleryCard.vue`, `app/components/gallery/PhotoLightbox.vue`, `app/components/home/HomeHero.vue`, `nuxt.config.ts`
- Test: `tests/unit/public-image-url.test.ts`, `tests/e2e/private-originals.spec.ts`

**Interfaces:**
- Produces: `buildPublicImageSet(derivatives: DerivativeSet, cdnBaseUrl: URL): PublicImageSet` with `src`, `srcset`, `width`, `height`, and fallback format.

- [ ] **Step 1: Write failing URL/privacy tests**

Assert CDN-host URLs, encoded immutable paths, correct `srcset`, no private endpoint or original key in public API/SSR HTML, and no original-download control in the lightbox.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/public-image-url.test.ts && npx playwright test tests/e2e/private-originals.spec.ts`

Expected: FAIL until the URL builder and repository mapping are active.

- [ ] **Step 3: Implement CDN mapping and cache headers**

Emit one-year immutable caching for versioned display images, short revalidating cache for public JSON/HTML, and preserve intrinsic dimensions on every image component.

- [ ] **Step 4: Verify no original leakage**

Run: `npm test -- tests/unit/public-image-url.test.ts && npm run build && npx playwright test tests/e2e/private-originals.spec.ts`

Expected: all tests pass and a recursive scan of captured responses finds no private bucket hostname.

- [ ] **Step 5: Commit**

```bash
git add server/media/public-image-url.ts server/repositories app/components nuxt.config.ts tests
git commit -m "feat: serve display images through cdn"
```

## Task 4: Containerized ECS deployment and Caddy security boundary

**Files:**
- Create: `deploy/app.Dockerfile`, `deploy/docker-compose.yml`, `deploy/Caddyfile`, `deploy/.env.example`
- Create: `server/health/health-service.ts`, `server/api/health.get.ts`
- Create: `docs/deployment.md`
- Test: `tests/unit/health-service.test.ts`, `tests/integration/deployment-config.test.ts`

**Interfaces:**
- Produces: `getHealthStatus(): Promise<{ status: 'ok' | 'degraded'; database: boolean; oss: boolean; lastBackupAt: string | null }>`.
- Produces: Docker services `app` and `caddy` with persistent `data` and `logs` volumes.

- [ ] **Step 1: Write failing configuration tests**

Assert non-root app user, read-only container filesystem except declared volumes, health check, request-body limit, HTTPS redirect, security headers, admin no-index header, and no published app port bypassing Caddy.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/health-service.test.ts tests/integration/deployment-config.test.ts`

Expected: FAIL because deployment and health files do not exist.

- [ ] **Step 3: Implement containers, health endpoint, and deployment documentation**

Set conservative Node memory limits suitable for 2 GB RAM, one application process, restart policies, log rotation, explicit volumes, and documented DNS/OSS/CDN environment variables.

- [ ] **Step 4: Build and validate containers**

Run: `docker compose -f deploy/docker-compose.yml config && docker compose -f deploy/docker-compose.yml build && npm test -- tests/unit/health-service.test.ts tests/integration/deployment-config.test.ts`

Expected: configuration is valid, image builds, and tests pass.

- [ ] **Step 5: Commit**

```bash
git add deploy server/health server/api/health.get.ts docs/deployment.md tests
git commit -m "ops: containerize app for ecs deployment"
```

## Task 5: SQLite backup, restore, and migration-safe deploy

**Files:**
- Create: `server/backup/sqlite-backup.ts`, `scripts/backup.ts`, `scripts/restore-backup.ts`
- Create: `deploy/backup.ps1`, `deploy/deploy.ps1`, `docs/disaster-recovery.md`
- Test: `tests/integration/sqlite-backup.test.ts`, `tests/integration/deploy-guard.test.ts`

**Interfaces:**
- Produces: `createConsistentBackup(dbPath, destination): Promise<BackupManifest>`.
- Produces: `restoreBackup(manifest, destinationDbPath): Promise<void>` after checksum and schema validation.

- [ ] **Step 1: Write failing backup tests**

Assert a backup taken during reads restores all committed rows, checksum corruption is rejected, restore never overwrites without explicit confirmation, retention keeps configured generations, and deployment aborts before migration when backup upload fails.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/integration/sqlite-backup.test.ts tests/integration/deploy-guard.test.ts`

Expected: FAIL because backup and guard modules do not exist.

- [ ] **Step 3: Implement backup/restore and guarded deployment**

Use SQLite's consistent backup mechanism, upload the database plus manifest to private OSS, verify remote existence, then allow migration and restart. Document and script a restore into a new path before replacing the active database.

- [ ] **Step 4: Perform a real local recovery rehearsal**

Run: `npm test -- tests/integration/sqlite-backup.test.ts tests/integration/deploy-guard.test.ts && npm run backup:local && npm run restore:verify`

Expected: tests pass and restored database integrity check returns `ok` with matching manifest checksum.

- [ ] **Step 5: Commit**

```bash
git add server/backup scripts deploy docs/disaster-recovery.md tests
git commit -m "ops: add verified sqlite backup and recovery"
```

## Task 6: Production resilience, observability, and release acceptance

**Files:**
- Create: `scripts/smoke-production.ts`, `docs/operations-runbook.md`
- Modify: `server/api/health.get.ts`, `deploy/Caddyfile`, `package.json`
- Create: `tests/integration/oss-outage.test.ts`, `tests/e2e/production-smoke.spec.ts`

**Interfaces:**
- Consumes: complete application and deployment.
- Produces: `npm run smoke:production -- --base-url <url>` and an operations runbook with alert thresholds and recovery actions.

- [ ] **Step 1: Write failing outage and smoke tests**

Assert OSS outage leaves existing published content readable, new media remains failed/retryable, count failure does not block lightbox, health reports degraded, login/upload/view limits return 429 appropriately, and representative public/admin flows fit within the documented memory ceiling.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/integration/oss-outage.test.ts && npx playwright test tests/e2e/production-smoke.spec.ts`

Expected: FAIL until degradation paths and smoke runner are complete.

- [ ] **Step 3: Implement observability and runbook**

Log structured request IDs, auth failures, media job failures, backup age, and health transitions without logging secrets or raw IPs. Document ECS resource, disk, API error, media queue, backup age, OSS/CDN traffic, and cost alert thresholds.

- [ ] **Step 4: Run final release verification**

Run: `npm test && npm run typecheck && npm run build && npx playwright test && docker compose -f deploy/docker-compose.yml config && npm run smoke:production -- --base-url http://127.0.0.1`

Expected: all commands exit 0; health is `ok`, upload bypasses the app process, a published story is visible, private originals are unreachable, and backup age is current.

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-production.ts docs/operations-runbook.md server/api/health.get.ts deploy/Caddyfile package.json package-lock.json tests
git commit -m "ops: verify production resilience and monitoring"
```

## Phase Acceptance

- Production uploads go browser-to-OSS under a short restricted policy.
- Original files remain private and absent from public responses.
- Public images use immutable CDN URLs and responsive variants.
- Docker deployment fits the 2-core/2-GB host because it never proxies or transforms public image bytes.
- A failed backup blocks deployment, and a verified restore rehearsal succeeds.
- The operations runbook covers degraded OSS, failed jobs, backup age, traffic spikes, and CDN-cost alerts.

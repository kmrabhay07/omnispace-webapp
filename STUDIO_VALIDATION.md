# Studio precision release — validation

21 November 2026. Implemented in the local checkout; not deployed to the VM or hosted frontend.

## Follow-up: API visibility and access controls

- Production client API base is now `/api`; the previous backend hostname is absent from the compiled browser JavaScript.
- Added a tested Vercel server-side gateway, server-only origin-secret filter, optional validated Caddy guard template, controlled authentication errors and stale-response session protection. Correct JWT and record ownership remain necessary for private routes.
- Updated the Three.js shadow-map setting to remove its deprecation warning. Browser tracking-prevention/lazy-image notices and legitimate 401 responses cannot be removed by hiding console output.
- Latest checks: **40 Angular tests, 30 backend tests and 5 Node gateway tests passed**. The Angular production build and Maven verification passed. Caddy template validation passed with a missing and a configured synthetic secret; the live Caddy config was not reloaded.
- Deployment health checks now obtain the origin secret from container configuration in memory so enabling origin protection will not cause the CI readiness probe to fail solely because it lacks the header.
- The live API was checked read-only: public listing reads returned 200; unauthenticated/invalid-token private design reads returned 401. No private data was retrieved.
- **Live activation remains pending Vercel account access.** No live origin block has been enabled because the current frontend must first be replaced with the configured gateway. Rollout details are in `infra/ORIGIN_PROTECTION.md`.

## Completed scope

- Exact room and furniture measurements, center position, rotation, name and color inspector.
- Decimal-feet and metric display with canonical feet retained in saved documents.
- Duplicate, lock and hide, including persistence through save/reload and undo/redo.
- Off/grid/wall/object snapping, grid-aware nudges and rotated footprint selection.
- Wall clearance values and 2D distance guides. Hidden objects and transient selection/distance aids are excluded from PNG exports.
- Confirmed Clear/preset replacement; one undo transaction per preset; functioning Office preset. Oversized furniture/presets are rejected without clearing the current room.
- Collapsible mobile panels, shortcut reference and optional backward-compatible backend fields.

## Verification results

- Frontend: `npm test -- --watch=false` — **37 tests passed across 10 files**.
- Backend: Maven `verify` — **22 tests passed across 5 suites**, including project serialization and legacy-project validation. Packaged JAR built successfully.
- Angular production build passed. Initial bundle approximately 325 kB raw; Studio remains a lazy-loaded route. No performance speedup is claimed.
- Geometry tests cover rotated footprints, wall/object snapping, hidden targets, selectable grid, snap-off bounds, metric round-trip and rotated hit testing.
- Component tests cover precise numeric edits, lock enforcement, unlocked/visible duplication, Clear cancellation, one-step preset undo/redo, invalid room changes, absolute-position retention on resize, keyboard input exclusions, grid nudges and actual Three.js object visibility.
- A rendered Angular component test clicks the actual catalog, Duplicate, Lock, Hide and Unlock controls. WebGL is not created in this DOM test.
- Real local MongoDB HTTP round-trip passed for a project containing metric display, object snapping, a 37-degree rotation, and hidden/locked furniture. Test data was isolated in a temporary RAM-backed Mongo container on port 27029, with backend port 18081 and frontend port 4201. No production connection was used.
- The temporary database container and owned preview/backend processes were stopped after validation.
- `git diff --check` passed.

## Remaining verification and limits

- Interactive Edge browser testing was interrupted by activity in the shared window; native UI control was stopped. Full visual desktop/mobile, touch dragging and downloaded-PNG review remain pending.
- Feet/inches compound fields, independent furniture vertical-height editing, doors/windows, arbitrary room boundaries, collisions, budgets and AI remain outside this first release.
- This release does not replace the continuously running Three.js render loop or add model caching. Those require performance measurements and resource-ownership tests before implementation.
- Deploy frontend and backend together. An old backend does not understand the new optional saved preferences/flags.

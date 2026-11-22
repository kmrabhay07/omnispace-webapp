# Omnispace Studio improvement plan

Prepared 21 November 2026 from the local implementation. This began as a code review and product plan; the implementation update below records the first release. It is not a completed browser usability audit, and production has not been changed.

Implementation update: Release 1's precision controls, feet/metric display, duplicate/lock/hide, configurable snapping, wall-distance display, safer presets/Clear and mobile panels are now implemented locally. Backend optional fields preserve compatibility with legacy projects. Vertical model-height controls and compound feet/inches entry remain future schema/UI work; this release uses decimal feet with inch-based grid choices. Releases 2–5 and the broader performance work below remain planned. Production deployment and a full interactive browser/mobile review are still pending; see `STUDIO_VALIDATION.md` for completed checks.

## Direction

Make Studio useful for answering: **Will this arrangement fit my room, what will it look like, and what will I need to buy?** Prioritize accurate editing and dependable saves before adding AI or more visual decoration.

## What already exists

- Three.js 3D view, top-down floor plan and elevation camera.
- Furniture catalog, bundled GLB models and procedural fallback models.
- Photo reference on the back wall and uploaded furniture as flat panels.
- Dragging, quarter-foot snapping, keyboard nudging and rotation.
- Wall palettes, basic floor materials, day/night lighting and room presets.
- Undo/redo, account autosave, version conflict detection and saved-design gallery.
- Property-linked projects and PNG export.

These should be extended rather than reimplemented.

## Gaps found in the code

| Finding | User impact | Relevant implementation |
| --- | --- | --- |
| Room controls only expose 10–36 ft in 2 ft increments, although backend dimensions allow 4–100 ft | Users cannot enter many real measurements | Designer template; backend DesignProject validation |
| Frontend type declares L_SHAPED, backend accepts only RECTANGLE, room builder uses a rectangular floor | L-shaped support is not implemented end to end | design-project.model.ts; DesignProject.java; build3DRoom |
| No editable doors, windows, wall segments or opening clearances | A design can fit the rectangle but block an actual entrance | Project schema and room builder |
| Placement clamps furniture within room bounds but does not check furniture-to-furniture intersections | Users can create overlapping layouts without a warning | editor-geometry.ts |
| Inspector is principally a placed-item list; rotation advances in 45-degree steps; photo resizing uses multipliers | Precise adjustments are awkward | Designer template and rotateSelected/resizePhoto |
| Clear removes furniture immediately; applying a preset performs several separate history changes | Easy to discard work or require multiple undo operations to restore one action | clearAllFurniture; applyRoomPreset |
| Saved-project conflict handling tells users to reopen; no recovery copy/merge choice | Unsaved local edits can be hard to recover | saveProject; DesignService version handling |
| Furniture price exists in catalog data, but placed objects do not store a pricing snapshot or currency | Cost estimates cannot yet be reliable historical project data | furniture-item.model.ts |
| Photos are embedded as data strings, with fixed limits | Large assets expand Mongo documents, saves and history snapshots | ImageData validation; project schema; README |
| Continuous animation loop and a new GLTFLoader load per placed/rebuilt model | Opportunities to reduce idle rendering and repeat asset work | initThreeJSEngine; create3DMesh |
| Gallery displays a reference room photo or placeholder rather than the actual arrangement | Saved designs are difficult to distinguish | design-gallery.component.ts |

## Delivery order

### Release 1 — Precise, easier editing

Highest priority; mostly improvements to the existing editor.

1. Replace the right sidebar with **Selection inspector + Objects** tabs. Enter exact position, width, depth and rotation; choose colors with a picker; reset individual values.
2. Add feet/inches and metric display. Store one canonical unit internally; migrate existing feet-based data explicitly. Distinguish furniture width, floor depth and vertical height instead of overloading `height`.
3. Add direct numeric room inputs alongside sliders, using matching frontend/backend bounds.
4. Add duplicate, object rename, lock and hide. Define hidden-item export behavior explicitly.
5. Add selectable snapping: off, grid, wall and object alignment. Show alignment guides and wall distances during dragging.
6. Make presets one undoable transaction. Add a confirmation or recoverable action for Clear. Surface the existing keyboard shortcuts in a compact help panel.
7. Keep the viewport prominent on mobile with collapsible panels/bottom sheets instead of forcing users to scroll past the entire sidebar.

Acceptance: a user can recreate a measured rectangular room, position and rotate an object numerically, duplicate it, lock it, undo a preset once, and reopen the saved design with the same result. Numeric changes, dragging and keyboard nudges must share placement rules.

### Release 2 — Rooms that match real homes

Build a room geometry model before adding arbitrary drawing tools.

1. Doors and windows with wall attachment, width, height and offset.
2. Door swing visualization and warnings when furniture blocks an opening.
3. L-shaped rooms, then custom wall polygons. Validate nonintersecting boundaries on both server and client.
4. Floor-plan image underlay: upload, set scale using a known distance, then manually trace/edit walls. Do not claim automatic measurement from an uncalibrated image.
5. Per-wall paint and materials; full-wall/cutaway controls for inspection.
6. Rulers, labeled dimensions and area calculation in the floor plan.

Acceptance: the same walls/openings appear in 2D, 3D, saving and exports. Legacy rectangular projects continue to load. Room edits produce clear relocation warnings rather than silently losing furniture.

### Release 3 — Layout assistance and shopping list

1. Warn about overlapping solid furniture, room-boundary violations and blocked door swings. Rugs and appropriate decor overlaps must remain valid.
2. Show user-configurable walkway/clearance guides. Treat them as planning aids, not building-code certification.
3. Furniture search, dimension filters, real thumbnails and recently used items.
4. Materials/finish variants and a larger curated furniture library.
5. Itemized quantity and budget panel with explicit currency. Distinguish catalog estimates, user-entered prices and unknown prices. Do not label seed catalog values as current retailer quotes.
6. Export a shopping list with optional manually supplied product links.

Acceptance: warnings identify the actual conflicting objects and can be explained/dismissed. Saved budgets preserve price/currency snapshots and clearly mark unavailable prices.

### Release 4 — Variants and presentation

1. Save as copy, named variants and side-by-side comparisons.
2. Generate real project thumbnails after meaningful edits/saves.
3. Save camera angles and add an interior walk-through camera with touch controls.
4. Export a dimensioned floor plan, high-resolution scene images and a PDF presentation containing the design name, views, measurements and item list.
5. Add owner-controlled, read-only sharing with revocable links before any collaborative editing.
6. Later, asynchronous comments attached to a selected object/view.

Acceptance: sharing never grants edit access, owners can revoke access, private projects remain private, and changing a variant does not modify its source.

### Release 5 — Optional AI assistant

After geometry and project schemas are stable:

- Suggest a reviewed furniture arrangement from room size, openings, existing pieces, budget and style preferences.
- Explain proposed moves and highlight collisions before the user applies them.
- Offer several variants; applying one creates an undoable change or new variant.
- Generate clearly labeled visual concepts from a room image. Keep generated imagery separate from the measured model; an AI render is not proof of physical fit.
- Do not promise single-photo reconstruction, accurate hidden measurements or guaranteed real-world product availability.
- Keep API keys server-side and show provider/cost behavior before paid generation. AI remains optional; measured editing must work without it.

## Reliability and performance work alongside the releases

- Separate the approximately 1,180-line DesignerComponent into project state/history, geometry, Three.js scene, image uploads and editor UI. Keep regression tests around behavior during extraction.
- Render on demand when the scene is idle; keep enough frames for orbit damping and model loads. Benchmark idle/drag frame time before claiming an improvement. [Three.js guidance](https://threejs.org/manual/pages/rendering-on-demand.html).
- Cache GLB source assets, clone instances safely and define ownership for shared materials/textures so disposing one object does not break another.
- Consider standard translation/rotation handles for direct editing, keeping precise numeric controls accessible. [TransformControls](https://threejs.org/docs/pages/TransformControls).
- Add a lower-quality mode for mobile, shadow-quality choices and a clear fallback when WebGL fails.
- Store media in private object storage with authenticated access and retain only asset references in MongoDB. Existing inline-image projects need a compatible migration path and backups.
- Keep undo/history entries lightweight; do not duplicate full image strings for each movement.
- Offer recovery of an unsaved local copy after a network failure or 409 conflict; do not overwrite another session silently.
- Add actual Mongo integration tests and browser coverage for save/reload, touch placement, resize, undo/redo and export. Do not deploy Studio changes as part of planning.

## Recommended first implementation scope

Start with **numeric room/furniture inspector, duplicate/lock, snap controls, wall-distance guides, safer presets/Clear and a mobile viewport layout**. This provides useful day-to-day improvements without immediately requiring external APIs or a new room geometry schema. Add render-on-demand and model caching after measuring the current baseline.

Then implement **doors/windows and dimensioned floor plans**, followed by **collision warnings and the budget panel**. These make Studio materially more useful than an editor that only places furniture in an empty rectangle.

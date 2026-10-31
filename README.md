# OmniSpace

A property marketplace and interior design studio built with Angular 22, Three.js, Java 17, Spring Boot 3.2.3, and MongoDB.

## Implemented workflows

- Register or sign in with a server-issued JWT. Failed requests never create local sessions.
- Create drafts, upload real listing photos and floor plans, choose amenities, edit, publish, and delete your own listings.
- Browse published listings with server-side filtering, sorting, and 24-item pagination.
- Contact an owner through a private buyer–owner conversation. Only its participants can read or send messages. Messages are shown as sent only after the server accepts them.
- Create named designs linked to a property or independent room. Autosave, save/restore across devices, saved-project gallery, version conflict detection, and delete.
- Upload room and furniture photos, arrange original bundled GLB sofa/table/chair/bed models, use measured placement, quarter-foot snapping, pointer/touch controls, undo/redo, and PNG export.
- Room photos are reference backdrops; furniture photos are flat panels. Uploaded photos are not automatically reconstructed into 3D geometry.

## Local development

Requirements: Java 17, Maven 3.9+, Node 22+, npm, and MongoDB.

1. Start MongoDB (for example, `docker compose up -d mongo`).
2. Set `JWT_SECRET` to a random secret of at least 32 UTF-8 bytes, for example with `openssl rand -base64 48`.
3. Set `MONGODB_URI=mongodb://localhost:27017/omnispace` and start the backend:
   `cd omnispace/backend && mvn spring-boot:run`.
4. In another terminal: `cd omnispace/frontend && npm ci --legacy-peer-deps && npm start`.
5. Open `http://localhost:4200`. The development proxy forwards `/api` to `localhost:8080`.

Production builds use `src/environments/environment.prod.ts`. Configure its API URL for your backend before building.

## Verification

```sh
cd omnispace/backend
mvn verify

cd ../frontend
npm test -- --watch=false
npm run build -- --configuration production
```

Tests cover anonymous access, record ownership, private conversation membership, server-controlled message identity, authentication failures, design persistence contracts and conflicts, map-popup escaping, undo branching, measured placement, and Three.js cleanup. They use isolated repositories/HTTP doubles; a real MongoDB deployment still needs a staging smoke test.

GitHub Actions runs both test suites and the production builds. In GitHub Settings → Rules → Rulesets, require pull requests and these checks on `main`: `build-backend`, `build-frontend`. Branch protection is an administrator setting; a workflow file alone cannot enforce it.

## Production configuration and existing data

- Set `JWT_SECRET` and `MONGODB_URI` on the backend.
- Set `ALLOWED_ORIGINS` to a comma-separated list of the exact trusted frontend origins, such as your production Vercel URL. The default only allows `http://localhost:4200`; arbitrary origins are rejected.
- Use HTTPS. Tokens expire after 24 hours. The client clears expired/rejected sessions.
- Deploy frontend and backend together: chat now uses `/api/conversations`; the old public `/api/messages` routes are closed.
- Old browser-only sessions are invalidated. Browser-only designs and unsent messages are not silently assigned to a different account.
- Legacy database listings without a persisted `status` are excluded from public search. An owner with the correct database `ownerId` can review, replace placeholder images, and republish them from **My listings**. Listings with fabricated legacy owner IDs require an administrator to verify and repair ownership; do not infer ownership from public name/contact fields.
- Old property-wide message records are retained in MongoDB but are not surfaced in private conversations. They may contain simulated owner replies and cannot safely be assigned to a conversation automatically.
- Photos are compressed in the browser and persisted with their owning record: at most 8 property photos, one floor plan, one room reference and 5 furniture photos per design; each encoded image is limited to 700,000 characters. This keeps records below MongoDB's document limit. For larger media collections, move binaries to authenticated object storage.
- Review existing data and create the indexes in `omnispace/backend/mongo-indexes.js` before production rollout. The script does not change ownership, publish legacy records, or delete data.
- New GLB assets are original project assets. Rebuild them with `node tools/generate-furniture.mjs` from the frontend directory.

## API boundaries

Public access is limited to authentication endpoints, published property reads, and furniture catalog reads. Property mutations require the owner; designs require their creator; conversations require either participant; furniture creation requires an administrator. Ownership, sender identity, timestamps, and publication visibility are enforced on the server. Map text is inserted as text nodes rather than raw HTML.

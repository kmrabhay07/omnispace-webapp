// Run with mongosh against the intended database after reviewing/backing up existing data.
// A unique email index will fail if duplicates exist; resolve them explicitly first.
db.users.createIndex({ email: 1 }, { unique: true });
db.properties.createIndex({ status: 1, createdAt: -1, _id: -1 });
db.properties.createIndex({ ownerId: 1, updatedAt: -1 });
db.design_projects.createIndex({ userId: 1, updatedAt: -1 });
db.conversations.createIndex({ buyerId: 1, updatedAt: -1 });
db.conversations.createIndex({ ownerId: 1, updatedAt: -1 });
db.messages.createIndex({ conversationId: 1, timestamp: -1 });
// Enable optimistic updates for old server-backed designs only; this does not assign an owner.
db.design_projects.updateMany({ version: { $exists: false } }, { $set: { version: NumberLong(0) } });

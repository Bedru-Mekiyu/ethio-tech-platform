import WhiteboardSnapshot from "../models/WhiteboardSnapshot.js";

const SNAPSHOT_BATCH_SIZE = 50;
const SNAPSHOT_INTERVAL_MS = 30000;

const pendingOps = new Map();

export const queueOps = (roomId, ops) => {
  if (!pendingOps.has(roomId)) {
    pendingOps.set(roomId, []);
  }
  pendingOps.get(roomId).push(...ops);

  if (pendingOps.get(roomId).length >= SNAPSHOT_BATCH_SIZE) {
    flushSnapshot(roomId);
  }
};

export const flushSnapshot = async (roomId) => {
  const ops = pendingOps.get(roomId);
  if (!ops || ops.length === 0) return;

  pendingOps.set(roomId, []);

  try {
    const latest = await WhiteboardSnapshot.findOne({ roomId }).sort({ revision: -1 });
    const nextRevision = (latest?.revision || 0) + 1;
    const sessionId = ops[0]?.sessionId || latest?.sessionId;

    if (!sessionId) return;

    await WhiteboardSnapshot.create({
      sessionId,
      roomId,
      snapshot: ops.map(op => ({
        opId: op.opId,
        type: op.type,
        points: op.points,
        color: op.color,
        width: op.width,
        text: op.text,
        x: op.x,
        y: op.y,
        w: op.w,
        h: op.h,
        userId: op.userId,
      })),
      revision: nextRevision,
      createdBy: ops[0].userId,
    });
  } catch (err) {
    console.error("[Whiteboard] Failed to flush snapshot:", err);
  }
};

export const getLatestSnapshot = async (roomId) => {
  return WhiteboardSnapshot.findOne({ roomId }).sort({ revision: -1 });
};

export const getHistory = async (roomId, fromRevision = 0) => {
  const snapshots = await WhiteboardSnapshot.find({
    roomId,
    revision: { $gt: fromRevision },
  }).sort({ revision: 1 });

  return snapshots.flatMap(s => s.snapshot);
};

export const clearBoard = async (roomId, userId) => {
  const latest = await WhiteboardSnapshot.findOne({ roomId }).sort({ revision: -1 });
  if (!latest) return;

  const nextRevision = (latest?.revision || 0) + 1;
  await WhiteboardSnapshot.create({
    sessionId: latest.sessionId,
    roomId,
    snapshot: [{ opId: `clear-${Date.now()}`, type: "clear", userId, points: [] }],
    revision: nextRevision,
    createdBy: userId,
  });
};

startSnapshotFlusher();

function startSnapshotFlusher() {
  setInterval(() => {
    for (const roomId of pendingOps.keys()) {
      flushSnapshot(roomId).catch(() => undefined);
    }
  }, SNAPSHOT_INTERVAL_MS);
}

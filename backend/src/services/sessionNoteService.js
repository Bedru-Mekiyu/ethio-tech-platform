import SessionNote from "../models/SessionNote.js";

export const getOrCreateNotes = async ({ sessionId, userId }) => {
  let notes = await SessionNote.findOne({ session: sessionId });
  if (!notes) {
    notes = await SessionNote.create({
      session: sessionId,
      createdBy: userId,
    });
  }
  return notes;
};

export const updateNotes = async ({ sessionId, userId, content, title }) => {
  const notes = await SessionNote.findOne({ session: sessionId });
  if (!notes) throw new Error("Notes not found. Create them first.");

  const newVersion = notes.currentVersion + 1;
  notes.versionHistory.push({
    content: notes.content,
    version: notes.currentVersion,
    updatedBy: userId,
    updatedAt: new Date(),
  });

  if (content !== undefined) notes.content = content;
  if (title !== undefined) notes.title = title.trim();
  notes.currentVersion = newVersion;

  const MAX_VERSIONS = 50;
  if (notes.versionHistory.length > MAX_VERSIONS) {
    notes.versionHistory = notes.versionHistory.slice(-MAX_VERSIONS);
  }

  await notes.save();
  return notes;
};

export const publishNotes = async ({ sessionId }) => {
  const notes = await SessionNote.findOne({ session: sessionId });
  if (!notes) throw new Error("Notes not found");
  notes.isPublished = true;
  await notes.save();
  return notes;
};

export const unpublishNotes = async ({ sessionId }) => {
  const notes = await SessionNote.findOne({ session: sessionId });
  if (!notes) throw new Error("Notes not found");
  notes.isPublished = false;
  await notes.save();
  return notes;
};

export const getNotesVersion = async ({ sessionId, version }) => {
  const notes = await SessionNote.findOne({ session: sessionId });
  if (!notes) throw new Error("Notes not found");
  if (version === notes.currentVersion) return { notes, content: notes.content, version: notes.currentVersion };
  const historic = notes.versionHistory.find((v) => v.version === version);
  if (!historic) throw new Error("Version not found");
  return { notes, content: historic.content, version: historic.version, updatedBy: historic.updatedBy, updatedAt: historic.updatedAt };
};

export const addResource = async ({ sessionId, title, url, type }) => {
  const notes = await SessionNote.findOne({ session: sessionId });
  if (!notes) throw new Error("Notes not found");
  notes.resources.push({ title, url, type });
  await notes.save();
  return notes;
};

export const removeResource = async ({ sessionId, resourceIndex }) => {
  const notes = await SessionNote.findOne({ session: sessionId });
  if (!notes) throw new Error("Notes not found");
  if (resourceIndex < 0 || resourceIndex >= notes.resources.length) {
    throw new Error("Resource not found");
  }
  notes.resources.splice(resourceIndex, 1);
  await notes.save();
  return notes;
};

export const getSessionNotesForStudent = async (sessionId) => {
  const notes = await SessionNote.findOne({ session: sessionId, isPublished: true });
  if (!notes) return null;
  return { title: notes.title, content: notes.content, resources: notes.resources, updatedAt: notes.updatedAt };
};

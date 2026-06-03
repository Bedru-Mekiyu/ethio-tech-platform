import SessionResource from "../models/SessionResource.js";

export const createResource = async ({ sessionId, userId, title, description, url, fileUrl, fileName, fileSize, type }) => {
  const resource = await SessionResource.create({
    session: sessionId,
    title: title.trim(),
    description: description?.trim(),
    url,
    fileUrl,
    fileName,
    fileSize,
    type,
    uploadedBy: userId,
  });
  return resource;
};

export const updateResource = async ({ resourceId, userId, updates }) => {
  const resource = await SessionResource.findOne({ _id: resourceId, uploadedBy: userId });
  if (!resource) throw new Error("Resource not found or not yours");
  const allowed = ["title", "description", "url", "fileUrl", "fileName", "fileSize", "type", "isPublished"];
  for (const field of allowed) {
    if (updates[field] !== undefined) resource[field] = updates[field];
  }
  await resource.save();
  return resource;
};

export const deleteResource = async ({ resourceId, userId }) => {
  const resource = await SessionResource.findOne({ _id: resourceId, uploadedBy: userId });
  if (!resource) throw new Error("Resource not found or not yours");
  await resource.deleteOne();
  return { deleted: true };
};

export const recordResourceView = async ({ resourceId, userId }) => {
  const resource = await SessionResource.findById(resourceId);
  if (!resource) throw new Error("Resource not found");
  const alreadyViewed = resource.views.some((v) => String(v.user) === String(userId));
  if (!alreadyViewed) {
    resource.views.push({ user: userId, viewedAt: new Date() });
    resource.viewCount += 1;
    await resource.save();
  }
  return resource;
};

export const recordResourceDownload = async ({ resourceId, userId }) => {
  const resource = await SessionResource.findById(resourceId);
  if (!resource) throw new Error("Resource not found");
  const existingView = resource.views.find((v) => String(v.user) === String(userId));
  if (existingView) {
    existingView.downloadedAt = new Date();
  } else {
    resource.views.push({ user: userId, viewedAt: new Date(), downloadedAt: new Date() });
    resource.viewCount += 1;
  }
  
  if (!resource.downloads) {
    resource.downloads = [];
  }
  resource.downloads.push({ user: userId, downloadedAt: new Date() });
  resource.downloadCount += 1;
  
  await resource.save();
  return resource;
};

export const getSessionResources = async (sessionId) => {
  return SessionResource.find({ session: sessionId, isPublished: true })
    .populate("uploadedBy", "fullName")
    .sort({ createdAt: -1 });
};

export const getResourceStats = async (sessionId) => {
  const resources = await SessionResource.find({ session: sessionId });
  return {
    total: resources.length,
    totalViews: resources.reduce((sum, r) => sum + r.viewCount, 0),
    totalDownloads: resources.reduce((sum, r) => sum + r.downloadCount, 0),
    byType: resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {}),
  };
};

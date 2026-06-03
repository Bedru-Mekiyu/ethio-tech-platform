import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as resourceService from "../services/sessionResourceService.js";

export const createResource = asyncHandler(async (req, res) => {
  const { title, description, url, fileUrl, fileName, fileSize, type } = req.body;
  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!url && !fileUrl) throw new ApiError(400, "URL or file URL is required");
  const resource = await resourceService.createResource({
    sessionId: req.params.sessionId,
    userId: req.user._id,
    title, description, url, fileUrl, fileName, fileSize,
    type: type || "link",
  });
  sendResponse(res, 201, "Resource created", { resource });
});

export const updateResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.updateResource({
    resourceId: req.params.resourceId,
    userId: req.user._id,
    updates: req.body,
  });
  sendResponse(res, 200, "Resource updated", { resource });
});

export const deleteResource = asyncHandler(async (req, res) => {
  await resourceService.deleteResource({ resourceId: req.params.resourceId, userId: req.user._id });
  sendResponse(res, 200, "Resource deleted");
});

export const getResources = asyncHandler(async (req, res) => {
  const resources = await resourceService.getSessionResources(req.params.sessionId);
  sendResponse(res, 200, "Resources fetched", { resources });
});

export const recordView = asyncHandler(async (req, res) => {
  const resource = await resourceService.recordResourceView({ resourceId: req.params.resourceId, userId: req.user._id });
  sendResponse(res, 200, "View recorded", { resource });
});

export const recordDownload = asyncHandler(async (req, res) => {
  const resource = await resourceService.recordResourceDownload({ resourceId: req.params.resourceId, userId: req.user._id });
  sendResponse(res, 200, "Download recorded", { resource });
});

export const getResourceStats = asyncHandler(async (req, res) => {
  const stats = await resourceService.getResourceStats(req.params.sessionId);
  sendResponse(res, 200, "Resource stats", stats);
});
